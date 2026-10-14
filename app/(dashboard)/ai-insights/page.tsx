import type { Metadata } from "next";

import { safeSession } from "@/lib/session";
import { prisma } from "@/services/db";
import { InsightsView } from "@/components/insights/insights-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Insights — CodeAtlas",
  robots: { index: false, follow: false },
};

export default async function InsightsPage() {
  const session = await safeSession();

  if (!session?.user?.id) {
    return (
      <InsightsView
        repositories={[]}
        largestFiles={[]}
        dependencyHotspots={[]}
        fanInHotspots={[]}
        symbolTypes={[]}
        languages={[]}
        recentChanges={[]}
        frameworks={[]}
        appAreas={[]}
        healthSignals={[]}
        totalFiles={0}
        totalSymbols={0}
        totalDeps={0}
      />
    );
  }

  const userId = session.user.id;
  const whereIndexed = { repository: { userId, status: "INDEXED" } };

  let repositories: { id: string; name: string; fullName: string | null; description: string | null; language: string | null; _count: { files: number; symbols: number; dependencies: number } }[] = [];
  let largestFiles: { path: string; size: number; language: string | null; repository: { name: string } }[] = [];
  let depCounts: { fileId: string; _count: number }[] = [];
  let fanInCounts: { targetPath: string | null; _count: number }[] = [];
  let symbolTypes: { type: string; _count: number }[] = [];
  let languages: { language: string | null; _count: number }[] = [];
  let recentChanges: { path: string; updatedAt: Date; language: string | null; repository: { name: string } }[] = [];
  let allImports: { target: string | null }[] = [];
  let allFilePaths: { path: string }[] = [];

  try {
    [repositories, largestFiles, depCounts, fanInCounts, symbolTypes, languages, recentChanges, allImports, allFilePaths] = await Promise.all([
      prisma.repository.findMany({
        where: { userId, status: "INDEXED" },
        select: {
          id: true, name: true, fullName: true, description: true, language: true,
          _count: { select: { files: true, symbols: true, dependencies: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.repoFile.findMany({
        where: whereIndexed,
        select: { path: true, size: true, language: true, repository: { select: { name: true } } },
        orderBy: { size: "desc" },
        take: 10,
      }),
      prisma.dependency.groupBy({
        by: ["fileId"],
        where: whereIndexed,
        _count: true,
        orderBy: { _count: { fileId: "desc" } },
        take: 10,
      }),
      prisma.dependency.groupBy({
        by: ["targetPath"],
        where: { ...whereIndexed, targetPath: { not: null } },
        _count: true,
        orderBy: { _count: { targetPath: "desc" } },
        take: 10,
      }),
      prisma.symbol.groupBy({
        by: ["type"],
        where: whereIndexed,
        _count: true,
        orderBy: { _count: { type: "desc" } },
      }),
      prisma.repoFile.groupBy({
        by: ["language"],
        where: { ...whereIndexed, language: { not: null } },
        _count: true,
        orderBy: { _count: { language: "desc" } },
      }),
      prisma.repoFile.findMany({
        where: whereIndexed,
        select: { path: true, updatedAt: true, language: true, repository: { select: { name: true } } },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
      prisma.dependency.findMany({
        where: whereIndexed,
        select: { target: true },
        take: 2000,
      }),
      prisma.repoFile.findMany({
        where: whereIndexed,
        select: { path: true },
      }),
    ]);
  } catch {
    // DB may be temporarily unreachable
  }

  // Resolve dependency hotspot file paths
  const depFileIds = depCounts.map((s) => s.fileId);
  const depFiles = depFileIds.length > 0
    ? await prisma.repoFile.findMany({ where: { id: { in: depFileIds } }, select: { id: true, path: true } })
    : [];
  const depFileMap = new Map(depFiles.map((f) => [f.id, f.path]));
  const dependencyHotspots = depCounts.map((s) => ({
    path: depFileMap.get(s.fileId) ?? "unknown",
    dependencyCount: s._count,
  }));

  const fanInHotspots = fanInCounts
    .filter((f) => f.targetPath)
    .map((f) => ({ path: f.targetPath!, dependentCount: f._count }));

  // Detect frameworks
  const importSet = new Set(allImports.map((i) => i.target?.toLowerCase()).filter(Boolean));
  const frameworks: string[] = [];
  if (importSet.has('react') || importSet.has('next')) frameworks.push('React');
  if (importSet.has('next')) frameworks.push('Next.js');
  if (importSet.has('vue')) frameworks.push('Vue');
  if (importSet.has('express')) frameworks.push('Express');
  if (importSet.has('prisma') || [...importSet].some(i => i?.startsWith('@prisma'))) frameworks.push('Prisma');
  if (importSet.has('tailwindcss') || [...importSet].some(i => i?.startsWith('tailwind'))) frameworks.push('Tailwind CSS');
  if (importSet.has('typescript') || [...importSet].some(i => i?.startsWith('typescript'))) frameworks.push('TypeScript');

  // Detect app areas
  const pathSet = new Set(allFilePaths.map(f => f.path.toLowerCase()));
  const hasApi = [...pathSet].some(p => p.includes('/api/') || p.includes('/routes/'));
  const hasComponents = [...pathSet].some(p => p.includes('/components/'));
  const hasPages = [...pathSet].some(p => p.includes('/pages/') || p.includes('/app/'));
  const hasServices = [...pathSet].some(p => p.includes('/services/') || p.includes('/lib/'));
  const hasTests = [...pathSet].some(p => p.includes('test') || p.includes('spec'));
  const hasConfig = [...pathSet].some(p => p.endsWith('config') || p.endsWith('.config.ts') || p.endsWith('.config.js'));

  const appAreas: string[] = [];
  if (hasComponents) appAreas.push('UI Components');
  if (hasPages) appAreas.push('Pages/Routes');
  if (hasApi) appAreas.push('API Layer');
  if (hasServices) appAreas.push('Services/Utilities');
  if (hasTests) appAreas.push('Tests');
  if (hasConfig) appAreas.push('Configuration');

  // Health signals
  const healthSignals: string[] = [];
  const totalFiles = repositories.reduce((s, r) => s + r._count.files, 0);
  const totalSymbols = repositories.reduce((s, r) => s + r._count.symbols, 0);
  const totalDeps = repositories.reduce((s, r) => s + r._count.dependencies, 0);
  if (hasTests) healthSignals.push('Has test coverage');
  else healthSignals.push('No test files detected — consider adding tests');
  if (hasConfig) healthSignals.push('Configuration files present');
  if (totalFiles > 0 && totalDeps / totalFiles > 5) healthSignals.push('High dependency density — some files may be tightly coupled');
  if (dependencyHotspots.length > 0 && dependencyHotspots[0].dependencyCount > 10) healthSignals.push(`"${dependencyHotspots[0].path.split('/').pop()}" has ${dependencyHotspots[0].dependencyCount} outgoing dependencies — consider refactoring`);
  if (fanInHotspots.length > 0 && fanInHotspots[0].dependentCount > 5) healthSignals.push(`"${fanInHotspots[0].path.split('/').pop()}" is used by ${fanInHotspots[0].dependentCount} other files — changes here have wide impact`);

  return (
    <InsightsView
      repositories={repositories.map((r) => ({
        name: r.name,
        fullName: r.fullName ?? r.name,
        description: r.description,
        language: r.language,
        fileCount: r._count.files,
        symbolCount: r._count.symbols,
        dependencyCount: r._count.dependencies,
      }))}
      largestFiles={largestFiles.map((f) => ({
        path: f.path,
        size: f.size,
        language: f.language,
        repoName: f.repository.name,
      }))}
      dependencyHotspots={dependencyHotspots}
      fanInHotspots={fanInHotspots}
      symbolTypes={symbolTypes.map((s) => ({
        type: s.type,
        count: s._count,
      }))}
      languages={languages
        .filter((l) => l.language)
        .map((l) => ({
          language: l.language!,
          count: l._count,
        }))}
      recentChanges={recentChanges.map((c) => ({
        path: c.path,
        updatedAt: c.updatedAt.toISOString(),
        language: c.language,
        repoName: c.repository.name,
      }))}
      frameworks={frameworks}
      appAreas={appAreas}
      healthSignals={healthSignals}
      totalFiles={totalFiles}
      totalSymbols={totalSymbols}
      totalDeps={totalDeps}
    />
  );
}
