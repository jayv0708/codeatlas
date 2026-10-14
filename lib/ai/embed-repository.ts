/**
 * CodeAtlas Repository Embedding Service
 *
 * Runs after repository ingestion to:
 * 1. Chunk source files into semantic units
 * 2. Generate embeddings for each chunk
 * 3. Store chunks + embeddings in the database
 *
 * Called from the ingestion pipeline after files are indexed.
 */

import { prisma } from "../db";
import { chunkFile, type ChunkInput } from "./chunker";
import { storeEmbedding } from "./vector-search";

/**
 * Chunk and embed all files in a repository.
 * This is idempotent — re-running replaces old chunks.
 */
export async function embedRepository(
  repositoryId: string,
  prismaClient?: typeof prisma,
): Promise<{ chunksCreated: number; embeddingsCreated: number }> {
  const db = prismaClient ?? prisma;

  // Fetch all indexed files with their content
  const files = await db.repoFile.findMany({
    where: { repositoryId, content: { not: null } },
    select: {
      id: true,
      path: true,
      language: true,
      content: true,
    },
  });

  if (files.length === 0) {
    return { chunksCreated: 0, embeddingsCreated: 0 };
  }

  // Fetch symbols for these files to guide chunking
  const symbols = await db.symbol.findMany({
    where: { repositoryId },
    select: {
      fileId: true,
      name: true,
      type: true,
      startLine: true,
      endLine: true,
    },
  });

  // Group symbols by file
  const symbolsByFile = new Map<string, typeof symbols>();
  for (const symbol of symbols) {
    const existing = symbolsByFile.get(symbol.fileId) ?? [];
    existing.push(symbol);
    symbolsByFile.set(symbol.fileId, existing);
  }

  // Delete existing chunks (cascade deletes embeddings)
  await db.codeChunk.deleteMany({ where: { repositoryId } });
  // Invalidate any cached access checks for this repo
  try {
    const { cacheDeletePrefix } = await import("../cache");
    cacheDeletePrefix(`repo-access:${repositoryId}`);
  } catch { /* cache module not critical */ }

  let totalChunks = 0;
  let totalEmbeddings = 0;

  // Process files in batches
  const BATCH_SIZE = 50;
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);

    const allChunks: Array<{
      repositoryId: string;
      fileId: string;
      path: string;
      language: string | null;
      chunkType: string;
      symbolName: string | null;
      content: string;
      startLine: number;
      endLine: number;
      tokenCount: number;
      hash: string;
    }> = [];

    for (const file of batch) {
      if (!file.content) continue;

      const input: ChunkInput = {
        fileId: file.id,
        repositoryId,
        path: file.path,
        language: file.language,
        content: file.content,
      };

      const fileSymbols = symbolsByFile.get(file.id);
      const chunks = chunkFile(
        input,
        fileSymbols?.map((s) => ({
          name: s.name,
          type: s.type,
          startLine: s.startLine,
          endLine: s.endLine,
        })),
      );

      allChunks.push(...chunks);
    }

    // Insert chunks in batch
    if (allChunks.length > 0) {
      // Use createMany for efficiency
      for (const chunk of allChunks) {
        try {
          const created = await db.codeChunk.create({
            data: {
              repositoryId: chunk.repositoryId,
              fileId: chunk.fileId,
              path: chunk.path,
              language: chunk.language,
              chunkType: chunk.chunkType,
              symbolName: chunk.symbolName,
              content: chunk.content,
              startLine: chunk.startLine,
              endLine: chunk.endLine,
              tokenCount: chunk.tokenCount,
              hash: chunk.hash,
            },
          });

          // Generate and store embedding
          try {
            await storeEmbedding(created.id, chunk.content, db);
            totalEmbeddings++;
          } catch {
            // Embedding failures are non-fatal — chunk is still searchable via full-text
          }

          totalChunks++;
        } catch (err) {
          // Duplicate hash — skip
          if ((err as Error).message?.includes("Unique constraint")) continue;
          throw err;
        }
      }
    }
  }

  return { chunksCreated: totalChunks, embeddingsCreated: totalEmbeddings };
}
