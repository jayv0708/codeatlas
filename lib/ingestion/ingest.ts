/**
 * Repository ingestion pipeline (Phase 3).
 *
 * Stages: DISCOVERING → FETCHING → PARSING → FINALIZING. Each stage updates
 * the IngestionJob + Repository.progress so the UI can show live progress.
 *
 * Design notes:
 *  - Runs in-process, fire-and-forget from the API layer (see runner.ts). On
 *    a serverless deploy this should move to a queue/worker; documented in
 *    the README as the first productionization step.
 *  - The final write is an atomic swap inside one transaction: old
 *    files/symbols/dependencies are deleted and replaced, so a repository is
 *    never left half-indexed (a failed run keeps the previous data on retry
 *    until the swap point).
 *  - Individual blob failures are skipped, not fatal — the job completes with
 *    the files it could read.
 */

import type { Prisma } from "@prisma/client";

import {
  GitHubApiError,
  fetchBlobContent,
  fetchRepositoryTree,
  getGitHubTokenForUser,
} from "@/lib/github";
import { resolveImport } from "@/lib/ingestion/dependencies";
import { MAX_FILES_PER_REPOSITORY, isIndexableFile } from "@/lib/ingestion/ignore";
import { parseSource, type ParseResult } from "@/lib/ingestion/parser";
import { prisma } from "@/services/db";
import { embedRepository } from "@/lib/ai/embed-repository";

const BLOB_FETCH_CONCURRENCY = 8;

type JobUpdate = Prisma.IngestionJobUpdateInput;

function updateJob(jobId: string, data: JobUpdate) {
  return prisma.ingestionJob.update({ where: { id: jobId }, data });
}

/** Run `fn` over `items` with `limit` concurrent workers. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workerCount = Math.max(1, Math.min(limit, items.length));
  const workers = Array.from({ length: workerCount }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function ingestRepository(jobId: string, repositoryId: string): Promise<void> {
  const job = await prisma.ingestionJob.findUnique({ where: { id: jobId } });
  const repo = await prisma.repository.findUnique({ where: { id: repositoryId } });
  if (!job || !repo) return;

  const tokenInfo = await getGitHubTokenForUser(repo.userId);
  const fullName = repo.fullName;

  try {
    if (!tokenInfo) throw new Error("GitHub access token is missing — please sign in again.");
    if (!fullName) throw new Error("This repository has no GitHub identity.");

    const token = tokenInfo.token;

    await updateJob(jobId, {
      status: "RUNNING",
      startedAt: new Date(),
      stage: "DISCOVERING",
      progress: 5,
    });
    await prisma.repository.update({
      where: { id: repositoryId },
      data: { status: "INDEXING", progress: 5, lastError: null },
    });

    // ── DISCOVERING ─────────────────────────────────────────────────────
    const branch = repo.defaultBranch ?? "HEAD";
    const tree = await fetchRepositoryTree(token, fullName, branch);
    const indexable = tree
      .filter((entry) => isIndexableFile(entry.path, entry.size))
      .slice(0, MAX_FILES_PER_REPOSITORY);
    const availableFiles = new Set(indexable.map((entry) => entry.path));

    // ── Incremental indexing: load existing SHAs to skip unchanged files ──
    const existingFiles = await prisma.repoFile.findMany({
      where: { repositoryId },
      select: { path: true, sha: true },
    });
    const existingShaByPath = new Map(existingFiles.map((f) => [f.path, f.sha]));
    const changedFiles = indexable.filter((entry) => existingShaByPath.get(entry.path) !== entry.sha);
    const unchangedCount = indexable.length - changedFiles.length;

    await updateJob(jobId, {
      stage: "FETCHING",
      totalFiles: indexable.length,
      filesProcessed: 0,
      progress: 10,
    });

    // ── FETCHING + PARSING (only changed/new files) ─────────────────────
    let processed = 0;
    const filesToFetch = changedFiles.length > 0 ? changedFiles : indexable;
    const parsed = await mapWithConcurrency(filesToFetch, BLOB_FETCH_CONCURRENCY, async (entry) => {
      let content = "";
      let result: ParseResult = { language: null, symbols: [], imports: [] };
      try {
        const blob = await fetchBlobContent(token, fullName, entry.sha);
        content = Buffer.from(blob.content, "base64").toString("utf-8");
        result = parseSource(entry.path, content);
      } catch {
        // Skip unreadable files rather than failing the whole job.
      }
      processed += 1;
      await updateJob(jobId, {
        filesProcessed: processed,
        progress: 10 + Math.round((processed / Math.max(1, filesToFetch.length)) * 50),
      });
      return { entry, content, result };
    });

    await updateJob(jobId, { stage: "PARSING", progress: 60 });

    // ── Atomic swap (incremental: only update changed files) ───────────
    await prisma.$transaction(async (tx) => {
      if (changedFiles.length > 0 && changedFiles.length < indexable.length) {
        // Incremental: update only changed files
        const changedPaths = new Set(changedFiles.map((e) => e.path));
        // Delete symbols/deps for changed files, then re-create
        const changedFileRecords = await tx.repoFile.findMany({
          where: { repositoryId, path: { in: [...changedPaths] } },
          select: { id: true, path: true },
        });
        const changedFileIds = changedFileRecords.map((f) => f.id);
        if (changedFileIds.length > 0) {
          await tx.symbol.deleteMany({ where: { fileId: { in: changedFileIds } } });
          await tx.dependency.deleteMany({ where: { fileId: { in: changedFileIds } } });
        }
        // Delete old repoFile records for changed paths, then insert new ones
        await tx.repoFile.deleteMany({ where: { repositoryId, path: { in: [...changedPaths] } } });
        // Insert changed files
        if (parsed.length > 0) {
          await tx.repoFile.createMany({
            data: parsed.map(({ entry, content, result }) => ({
              repositoryId,
              path: entry.path,
              language: result.language,
              content,
              size: entry.size,
              sha: entry.sha,
            })),
          });
        }
      } else {
        // Full re-index: delete everything and recreate
        await tx.repoFile.deleteMany({ where: { repositoryId } });
        if (parsed.length > 0) {
          await tx.repoFile.createMany({
            data: parsed.map(({ entry, content, result }) => ({
              repositoryId,
              path: entry.path,
              language: result.language,
              content,
              size: entry.size,
              sha: entry.sha,
            })),
          });
        }
      }

      if (parsed.length > 0) {
        const files = await tx.repoFile.findMany({
          where: { repositoryId },
          select: { id: true, path: true },
        });
        const fileIdByPath = new Map(files.map((file) => [file.path, file.id]));

        const symbols: Prisma.SymbolCreateManyInput[] = [];
        const dependencies: Prisma.DependencyCreateManyInput[] = [];

        for (const { entry, result } of parsed) {
          const fileId = fileIdByPath.get(entry.path);
          if (!fileId) continue;
          for (const symbol of result.symbols) {
            symbols.push({
              repositoryId,
              fileId,
              name: symbol.name,
              type: symbol.type,
              startLine: symbol.startLine,
              endLine: symbol.endLine,
            });
          }
          for (const imp of result.imports) {
            dependencies.push({
              repositoryId,
              fileId,
              sourcePath: entry.path,
              target: imp.specifier,
              targetPath: resolveImport(entry.path, imp.specifier, availableFiles),
              kind: imp.kind,
            });
          }
        }

        if (symbols.length > 0) await tx.symbol.createMany({ data: symbols });
        if (dependencies.length > 0) await tx.dependency.createMany({ data: dependencies });
      }
    });

    console.log(`[ingest] Completed: ${parsed.length} files parsed, ${unchangedCount} unchanged files skipped`);

    // ── FINALIZING ──────────────────────────────────────────────────────
    await updateJob(jobId, {
      stage: "EMBEDDING",
      progress: 95,
    });

    // Chunk and embed all indexed files
    try {
      await embedRepository(repositoryId);
    } catch (embedErr) {
      // Embedding failures are non-fatal — the repo is still searchable via full-text
      console.error("[ingest] Embedding failed (non-fatal):", embedErr);
    }

    const finishedAt = new Date();
    await prisma.repository.update({
      where: { id: repositoryId },
      data: { status: "INDEXED", progress: 100, lastError: null, indexedAt: finishedAt },
    });
    await updateJob(jobId, {
      status: "COMPLETED",
      stage: null,
      progress: 100,
      filesProcessed: parsed.length,
      finishedAt,
    });
  } catch (error) {
    const message =
      error instanceof GitHubApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Unknown ingestion error";
    await prisma.repository.update({
      where: { id: repositoryId },
      data: { status: "FAILED", lastError: message },
    });
    await updateJob(jobId, {
      status: "FAILED",
      stage: null,
      error: message,
      finishedAt: new Date(),
    });
  }
}
