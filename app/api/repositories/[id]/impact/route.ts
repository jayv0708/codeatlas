/**
 * POST /api/repositories/[id]/impact
 *
 * Analyzes the impact of changing a specific component/symbol/file.
 * Returns direct dependencies, indirect dependencies, affected APIs,
 * related files, and an overall impact level (Low/Medium/High).
 *
 * Body: { "target": "UserService" } — can be a symbol name or file path.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/db";
import { rateLimit } from "@/lib/rate-limit";

interface ImpactResult {
  target: string;
  impactLevel: "low" | "medium" | "high";
  directDependencies: Array<{ file: string; symbol?: string; kind: string }>;
  indirectDependencies: Array<{ file: string; symbol?: string; kind: string }>;
  dependents: Array<{ file: string; symbol?: string; kind: string }>;
  indirectDependents: Array<{ file: string; symbol?: string; kind: string }>;
  affectedApis: Array<{ file: string; symbol?: string }>;
  affectedTests: Array<{ file: string }>;
  relatedFiles: Array<{ file: string; reason: string }>;
  summary: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: repositoryId } = await params;
    const repo = await prisma.repository.findFirst({
      where: { id: repositoryId, userId: session.user.id as string },
      select: { id: true, status: true, name: true },
    });

    if (!repo) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    if (repo.status !== "INDEXED") {
      return NextResponse.json(
        { error: "Repository is not indexed yet." },
        { status: 400 },
      );
    }

    // Rate limit: 20 requests per minute per user
    const rl = rateLimit(`impact:${session.user.id}`, { windowMs: 60_000, max: 20 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { target } = body;

    if (!target || typeof target !== "string") {
      return NextResponse.json({ error: "target is required" }, { status: 400 });
    }

    // Find matching symbols
    const matchingSymbols = await prisma.symbol.findMany({
      where: {
        repositoryId,
        OR: [
          { name: { contains: target, mode: "insensitive" } },
          { file: { path: { contains: target, mode: "insensitive" } } },
        ],
      },
      select: {
        id: true,
        name: true,
        type: true,
        fileId: true,
        file: { select: { id: true, path: true, language: true } },
      },
      take: 20,
    });

    // Also find matching files
    const matchingFiles = await prisma.repoFile.findMany({
      where: {
        repositoryId,
        path: { contains: target, mode: "insensitive" },
      },
      select: {
        id: true,
        path: true,
        language: true,
      },
      take: 10,
    });

    // Collect all file IDs that are targets
    const targetFileIds = new Set<string>();
    const targetSymbolNames = new Set<string>();
    for (const s of matchingSymbols) {
      targetFileIds.add(s.fileId);
      targetSymbolNames.add(s.name);
    }
    for (const f of matchingFiles) {
      targetFileIds.add(f.id);
    }

    if (targetFileIds.size === 0) {
      return NextResponse.json({
        target,
        impactLevel: "low" as const,
        directDependencies: [],
        indirectDependencies: [],
        dependents: [],
        indirectDependents: [],
        affectedApis: [],
        affectedTests: [],
        relatedFiles: [],
        summary: `No files or symbols matching "${target}" were found in the repository.`,
      });
    }

    // Find direct dependencies FROM target files
    const directDeps = await prisma.dependency.findMany({
      where: { repositoryId, fileId: { in: [...targetFileIds] } },
      select: {
        id: true,
        target: true,
        targetPath: true,
        kind: true,
        file: { select: { path: true } },
      },
    });

    // Find direct dependents — files that import FROM target files
    const targetPaths = matchingFiles.map((f) => f.path);
    const directDependents = await prisma.dependency.findMany({
      where: {
        repositoryId,
        OR: [
          { targetPath: { in: targetPaths } },
          ...targetSymbolNames.size > 0
            ? [{ target: { in: [...targetSymbolNames] } }]
            : [],
        ],
      },
      select: {
        id: true,
        target: true,
        targetPath: true,
        kind: true,
        fileId: true,
        file: { select: { path: true } },
      },
    });

    // Collect secondary targets for indirect deps
    const secondaryFileIds = new Set<string>();
    const secondaryPaths = new Set<string>();
    for (const d of directDeps) {
      if (d.targetPath) secondaryPaths.add(d.targetPath);
    }

    // Find indirect dependencies (deps of deps)
    let indirectDeps: Array<{ file: string; symbol?: string; kind: string }> = [];
    if (secondaryPaths.size > 0) {
      const indirectFiles = await prisma.repoFile.findMany({
        where: { repositoryId, path: { in: [...secondaryPaths] } },
        select: { id: true },
      });
      for (const f of indirectFiles) secondaryFileIds.add(f.id);

      if (secondaryFileIds.size > 0) {
        const deeperDeps = await prisma.dependency.findMany({
          where: {
            repositoryId,
            fileId: { in: [...secondaryFileIds] },
            NOT: { fileId: { in: [...targetFileIds] } },
          },
          select: {
            target: true,
            targetPath: true,
            kind: true,
            file: { select: { path: true } },
          },
          take: 50,
        });
        indirectDeps = deeperDeps.map((d) => ({
          file: d.file.path,
          symbol: d.target,
          kind: d.kind,
        }));
      }
    }

    // Find indirect dependents (files that depend on direct dependents)
    const directDependentFileIds = [...new Set(directDependents.map((d) => d.fileId))];
    let indirectDependents: Array<{ file: string; symbol?: string; kind: string }> = [];
    if (directDependentFileIds.length > 0) {
      const deeperDeps = await prisma.dependency.findMany({
        where: {
          repositoryId,
          fileId: { in: directDependentFileIds },
          NOT: { fileId: { in: [...targetFileIds] } },
        },
        select: {
          target: true,
          targetPath: true,
          kind: true,
          file: { select: { path: true } },
        },
        take: 50,
      });
      indirectDependents = deeperDeps.map((d) => ({
        file: d.file.path,
        symbol: d.target,
        kind: d.kind,
      }));
    }

    // Find affected APIs (exported symbols from target files)
    const affectedApis = await prisma.symbol.findMany({
      where: {
        repositoryId,
        fileId: { in: [...targetFileIds] },
        type: { in: ["export", "function", "class", "interface"] },
      },
      select: { name: true, file: { select: { path: true } } },
      take: 30,
    });

    // Find affected tests
    const affectedTests = await prisma.repoFile.findMany({
      where: {
        repositoryId,
        OR: [
          { path: { contains: "test", mode: "insensitive" } },
          { path: { contains: "spec", mode: "insensitive" } },
          { path: { contains: "__tests__", mode: "insensitive" } },
        ],
      },
      select: { path: true },
      take: 20,
    });

    // Determine impact level
    const totalAffected =
      directDependents.length + indirectDependents.length + indirectDeps.length;
    let impactLevel: "low" | "medium" | "high" = "low";
    if (totalAffected > 10 || directDependents.length > 5) {
      impactLevel = "high";
    } else if (totalAffected > 3 || directDependents.length > 2) {
      impactLevel = "medium";
    }

    // Build summary
    const summaryParts = [
      `Changing "${target}" would directly affect ${directDependents.length} file(s).`,
    ];
    if (indirectDependents.length > 0) {
      summaryParts.push(`${indirectDependents.length} additional file(s) could be indirectly affected.`);
    }
    if (affectedApis.length > 0) {
      summaryParts.push(`${affectedApis.length} exported API(s) are defined here.`);
    }
    if (affectedTests.length > 0) {
      summaryParts.push(`${affectedTests.length} test file(s) exist in the repository.`);
    }

    const result: ImpactResult = {
      target,
      impactLevel,
      directDependencies: directDeps.map((d) => ({
        file: d.file.path,
        symbol: d.target,
        kind: d.kind,
      })),
      indirectDependencies: indirectDeps,
      dependents: directDependents.map((d) => ({
        file: d.file.path,
        symbol: d.target,
        kind: d.kind,
      })),
      indirectDependents,
      affectedApis: affectedApis.map((a) => ({
        file: a.file.path,
        symbol: a.name,
      })),
      affectedTests: affectedTests.map((t) => ({ file: t.path })),
      relatedFiles: [],
      summary: summaryParts.join(" "),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[impact] Error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
