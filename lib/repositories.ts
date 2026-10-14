import type { Prisma } from "@prisma/client";

import { prisma } from "@/services/db";
import type { RepositoryDetail, RepositorySummary } from "@/types";

export const repositoryInclude = {
  _count: { select: { files: true, symbols: true, dependencies: true } },
  ingestionJobs: { orderBy: { createdAt: "desc" }, take: 1 },
} satisfies Prisma.RepositoryInclude;

export type RepositoryWithStats = Prisma.RepositoryGetPayload<{
  include: typeof repositoryInclude;
}>;

function toRepositoryJob(job: RepositoryWithStats["ingestionJobs"][number] | undefined) {
  if (!job) return null;
  return {
    id: job.id,
    status: job.status,
    stage: job.stage,
    progress: job.progress,
    error: job.error,
    totalFiles: job.totalFiles,
    filesProcessed: job.filesProcessed,
  };
}

export function toRepositorySummary(repo: RepositoryWithStats): RepositorySummary {
  return {
    id: repo.id,
    name: repo.name,
    fullName: repo.fullName,
    description: repo.description,
    defaultBranch: repo.defaultBranch,
    language: repo.language,
    isPrivate: repo.isPrivate,
    status: repo.status as RepositorySummary["status"],
    progress: repo.progress,
    lastError: repo.lastError,
    indexedAt: repo.indexedAt?.toISOString() ?? null,
    counts: {
      files: repo._count.files,
      symbols: repo._count.symbols,
      dependencies: repo._count.dependencies,
    },
    job: toRepositoryJob(repo.ingestionJobs[0]),
  };
}

/**
 * Detail payload for one repository, scoped to the requesting user.
 * Returns `null` when the repository does not exist for this user.
 */
export async function getRepositoryDetail(
  repositoryId: string,
  userId: string,
): Promise<RepositoryDetail | null> {
  const repository = await prisma.repository.findFirst({
    where: { id: repositoryId, userId },
    include: repositoryInclude,
  });
  if (!repository) return null;

  const [languages, symbolTypes, topSymbols] = await Promise.all([
    prisma.repoFile.groupBy({
      by: ["language"],
      where: { repositoryId },
      _count: { _all: true },
    }),
    prisma.symbol.groupBy({
      by: ["type"],
      where: { repositoryId },
      _count: { _all: true },
    }),
    prisma.symbol.findMany({
      where: { repositoryId, type: { in: ["class", "function"] } },
      orderBy: [{ type: "asc" }, { name: "asc" }],
      take: 50,
      include: { file: { select: { path: true } } },
    }),
  ]);

  return {
    ...toRepositorySummary(repository),
    createdAt: repository.createdAt.toISOString(),
    languages: languages.map((row) => ({ language: row.language, count: row._count._all })),
    symbolTypes: symbolTypes.map((row) => ({ type: row.type, count: row._count._all })),
    topSymbols: topSymbols.map((symbol) => ({
      name: symbol.name,
      type: symbol.type,
      startLine: symbol.startLine,
      path: symbol.file.path,
    })),
  };
}
