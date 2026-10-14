import { beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/services/db";

async function probeDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

const dbAvailable = await probeDatabase();

describe.skipIf(!dbAvailable)("repositories — database integration", () => {
  beforeAll(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE TABLE "IngestionJob", "Dependency", "Symbol", "RepoFile", "Repository", "Session", "Account", "User" RESTART IDENTITY CASCADE',
    );
  });

  it("scopes repositories to their owner", async () => {
    const userA = await prisma.user.create({ data: { email: "repo-a@example.com" } });
    const userB = await prisma.user.create({ data: { email: "repo-b@example.com" } });

    const repo = await prisma.repository.create({
      data: { userId: userA.id, name: "app", fullName: "a/app" },
    });

    const visibleToA = await prisma.repository.findFirst({
      where: { id: repo.id, userId: userA.id },
    });
    const visibleToB = await prisma.repository.findFirst({
      where: { id: repo.id, userId: userB.id },
    });

    expect(visibleToA?.id).toBe(repo.id);
    expect(visibleToB).toBeNull();

    await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });
  });

  it("allows two users to connect the same GitHub repository", async () => {
    const userA = await prisma.user.create({ data: { email: "shared-a@example.com" } });
    const userB = await prisma.user.create({ data: { email: "shared-b@example.com" } });

    await prisma.repository.create({
      data: { userId: userA.id, name: "shared", fullName: "org/shared" },
    });
    const second = await prisma.repository.create({
      data: { userId: userB.id, name: "shared", fullName: "org/shared" },
    });

    expect(second.id).toBeTruthy();

    await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });
  });

  it("deletes files, symbols, dependencies, and jobs when a repository is deleted (cascade)", async () => {
    const user = await prisma.user.create({ data: { email: "cascade-repo@example.com" } });

    const repo = await prisma.repository.create({
      data: {
        userId: user.id,
        name: "app",
        fullName: "cascade/app",
        files: {
          create: {
            path: "src/index.ts",
            language: "TypeScript",
            content: "export const x = 1;",
            size: 20,
          },
        },
        ingestionJobs: { create: { status: "QUEUED" } },
      },
    });

    const file = await prisma.repoFile.findFirstOrThrow({ where: { repositoryId: repo.id } });
    await prisma.symbol.create({
      data: {
        repositoryId: repo.id,
        fileId: file.id,
        name: "x",
        type: "export",
        startLine: 1,
        endLine: 1,
      },
    });
    await prisma.dependency.create({
      data: {
        repositoryId: repo.id,
        fileId: file.id,
        sourcePath: "src/index.ts",
        target: "./y",
        kind: "import",
      },
    });

    await prisma.repository.delete({ where: { id: repo.id } });

    expect(await prisma.repoFile.count({ where: { repositoryId: repo.id } })).toBe(0);
    expect(await prisma.symbol.count({ where: { repositoryId: repo.id } })).toBe(0);
    expect(await prisma.dependency.count({ where: { repositoryId: repo.id } })).toBe(0);
    expect(await prisma.ingestionJob.count({ where: { repositoryId: repo.id } })).toBe(0);

    await prisma.user.delete({ where: { id: user.id } });
  });
});
