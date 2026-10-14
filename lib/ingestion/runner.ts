/**
 * In-process background ingestion runner.
 *
 * `startIngestion` creates the job row, flips the repository to QUEUED, and
 * kicks off `ingestRepository` fire-and-forget (the API response returns
 * immediately; the UI polls for progress). A per-repository guard prevents
 * concurrent runs for the same repo. On a serverless/container deploy this
 * should move to a real queue — see README productionization notes.
 */

import { ingestRepository } from "@/lib/ingestion/ingest";
import { prisma } from "@/services/db";

const running = new Set<string>();

export async function startIngestion(
  repositoryId: string,
  userId: string,
): Promise<{ jobId: string | null; alreadyRunning: boolean }> {
  const repo = await prisma.repository.findFirst({ where: { id: repositoryId, userId } });
  if (!repo) throw new Error("REPOSITORY_NOT_FOUND");

  if (running.has(repositoryId)) {
    const active = await prisma.ingestionJob.findFirst({
      where: { repositoryId, status: { in: ["QUEUED", "RUNNING"] } },
      orderBy: { createdAt: "desc" },
    });
    return { jobId: active?.id ?? null, alreadyRunning: true };
  }

  // Supersede any stale jobs left by a previous run/crash.
  await prisma.ingestionJob.updateMany({
    where: { repositoryId, status: { in: ["QUEUED", "RUNNING"] } },
    data: { status: "FAILED", error: "Superseded by a new ingestion run", finishedAt: new Date() },
  });

  const job = await prisma.ingestionJob.create({
    data: { repositoryId, status: "QUEUED", stage: "QUEUED" },
  });
  await prisma.repository.update({
    where: { id: repositoryId },
    data: { status: "QUEUED", progress: 0, lastError: null },
  });

  running.add(repositoryId);
  void ingestRepository(job.id, repositoryId).finally(() => running.delete(repositoryId));

  return { jobId: job.id, alreadyRunning: false };
}
