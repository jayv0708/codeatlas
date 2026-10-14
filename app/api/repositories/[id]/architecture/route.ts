/**
 * GET /api/repositories/[id]/architecture
 *
 * Returns the dependency graph for a repository — nodes (symbols/files) and
 * edges (dependencies). Used by the architecture visualization page.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/db";

export async function GET(
  _request: NextRequest,
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

    // Fetch all dependencies for this repository
    const dependencies = await prisma.dependency.findMany({
      where: { repositoryId },
      select: {
        id: true,
        fileId: true,
        sourcePath: true,
        target: true,
        targetPath: true,
        kind: true,
        file: {
          select: { path: true, language: true },
        },
      },
    });

    // Fetch all symbols for this repository
    const symbols = await prisma.symbol.findMany({
      where: { repositoryId },
      select: {
        id: true,
        name: true,
        type: true,
        startLine: true,
        endLine: true,
        file: {
          select: { path: true, language: true },
        },
      },
      orderBy: { name: "asc" },
    });

    // Fetch files grouped by language
    const files = await prisma.repoFile.findMany({
      where: { repositoryId },
      select: {
        id: true,
        path: true,
        language: true,
        size: true,
        _count: {
          select: { symbols: true, dependencies: true },
        },
      },
      orderBy: { path: "asc" },
    });

    // Build nodes from files (each file is a node)
    const nodes = files.map((f) => ({
      id: f.id,
      path: f.path,
      language: f.language,
      size: f.size,
      symbolCount: f._count.symbols,
      dependencyCount: f._count.dependencies,
    }));

    // Build edges from dependencies
    const edges = dependencies.map((d) => ({
      id: d.id,
      source: d.file.path,
      sourceFileId: d.fileId,
      target: d.targetPath ?? d.target,
      targetPath: d.targetPath,
      kind: d.kind,
    }));

    // Compute file-level dependency summary
    const fileDependencyMap = new Map<string, Set<string>>();
    const fileDependentMap = new Map<string, Set<string>>();

    for (const edge of edges) {
      if (!fileDependencyMap.has(edge.source)) {
        fileDependencyMap.set(edge.source, new Set());
      }
      fileDependencyMap.get(edge.source)!.add(edge.targetPath ?? edge.target);

      if (edge.targetPath) {
        if (!fileDependentMap.has(edge.targetPath)) {
          fileDependentMap.set(edge.targetPath, new Set());
        }
        fileDependentMap.get(edge.targetPath)!.add(edge.source);
      }
    }

    // Compute impact metrics for each file
    const impactScores = files.map((f) => {
      const deps = fileDependencyMap.get(f.path) ?? new Set();
      const dependents = fileDependentMap.get(f.path) ?? new Set();
      const score = deps.size + dependents.size * 2; // dependents weighted higher
      return { path: f.path, score, depCount: deps.size, dependentCount: dependents.size };
    });

    impactScores.sort((a, b) => b.score - a.score);

    // Group symbols by type
    const symbolTypeCounts = new Map<string, number>();
    for (const s of symbols) {
      symbolTypeCounts.set(s.type, (symbolTypeCounts.get(s.type) ?? 0) + 1);
    }

    return NextResponse.json({
      repository: { id: repo.id, name: repo.name, status: repo.status },
      nodes,
      edges,
      symbols: symbols.slice(0, 200), // Limit for performance
      symbolTypeCounts: Object.fromEntries(symbolTypeCounts),
      impactScores: impactScores.slice(0, 50),
      stats: {
        totalFiles: files.length,
        totalDependencies: dependencies.length,
        totalSymbols: symbols.length,
        languages: [...new Set(files.map((f) => f.language).filter(Boolean))],
      },
    });
  } catch (error) {
    console.error("[architecture] Error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
