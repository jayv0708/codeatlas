import type { Metadata } from "next";

import { safeSession } from "@/lib/session";
import { prisma } from "@/services/db";
import { ArchitectureView } from "@/components/architecture/architecture-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Architecture — CodeAtlas",
  robots: { index: false, follow: false },
};

export default async function ArchitecturePage() {
  const session = await safeSession();

  if (!session?.user?.id) {
    return (
      <ArchitectureView
        repositories={[]}
        dependencies={[]}
        symbols={[]}
        topDirs={[]}
        frameworks={[]}
        architecturePattern="Unknown"
        appAreas={{ hasApi: false, hasComponents: false, hasPages: false, hasServices: false, hasTests: false, hasUtils: false, hasStyles: false, hasConfig: false }}
        totalFiles={0}
      />
    );
  }

  const userId = session.user.id;
  const whereIndexed = { repository: { userId, status: "INDEXED" } };

  let repositories: { id: string; name: string; fullName: string | null; language: string | null; description: string | null; _count: { files: number; symbols: number; dependencies: number } }[] = [];
  let dependencies: { sourcePath: string; target: string; targetPath: string | null; kind: string; file: { path: string; language: string | null } }[] = [];
  let symbols: { name: string; type: string; startLine: number; endLine: number; file: { path: string; language: string | null } }[] = [];
  let allFiles: { path: string; language: string | null }[] = [];
  let allImports: { target: string | null }[] = [];

  try {
    [repositories, dependencies, symbols, allFiles, allImports] = await Promise.all([
      prisma.repository.findMany({
        where: { userId, status: "INDEXED" },
        select: {
          id: true,
          name: true,
          fullName: true,
          language: true,
          description: true,
          _count: { select: { files: true, symbols: true, dependencies: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.dependency.findMany({
        where: whereIndexed,
        select: {
          sourcePath: true,
          target: true,
          targetPath: true,
          kind: true,
          file: { select: { path: true, language: true } },
        },
        take: 500,
      }),
      prisma.symbol.findMany({
        where: { ...whereIndexed, type: { in: ["class", "function", "interface"] } },
        select: {
          name: true,
          type: true,
          startLine: true,
          endLine: true,
          file: { select: { path: true, language: true } },
        },
        take: 300,
      }),
      prisma.repoFile.findMany({
        where: whereIndexed,
        select: { path: true, language: true },
      }),
      prisma.dependency.findMany({
        where: whereIndexed,
        select: { target: true },
        take: 2000,
      }),
    ]);
  } catch {
    // DB may be temporarily unreachable
  }

  // Build directory tree
  const dirCounts = new Map<string, number>();
  for (const f of allFiles) {
    const parts = f.path.split('/');
    if (parts.length >= 2) {
      const topDir = parts[0] === 'src' ? parts.slice(0, 2).join('/') : parts[0];
      dirCounts.set(topDir, (dirCounts.get(topDir) ?? 0) + 1);
    }
  }
  const topDirs = [...dirCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([dir, count]) => ({ dir, fileCount: count }));

  // Detect frameworks
  const importSet = new Set(allImports.map(i => i.target?.toLowerCase()).filter(Boolean));
  const frameworks: string[] = [];
  if (importSet.has('react') || importSet.has('next')) frameworks.push('React');
  if (importSet.has('next')) frameworks.push('Next.js');
  if (importSet.has('vue')) frameworks.push('Vue');
  if (importSet.has('express')) frameworks.push('Express');
  if (importSet.has('prisma') || [...importSet].some(i => i?.startsWith('@prisma'))) frameworks.push('Prisma');
  if (importSet.has('tailwindcss') || [...importSet].some(i => i?.startsWith('tailwind'))) frameworks.push('Tailwind CSS');

  // Detect app areas
  const pathSet = new Set(allFiles.map(f => f.path.toLowerCase()));
  const hasApi = [...pathSet].some(p => p.includes('/api/') || p.includes('/routes/'));
  const hasComponents = [...pathSet].some(p => p.includes('/components/'));
  const hasPages = [...pathSet].some(p => p.includes('/pages/') || p.includes('/app/'));
  const hasServices = [...pathSet].some(p => p.includes('/services/') || p.includes('/lib/'));
  const hasTests = [...pathSet].some(p => p.includes('test') || p.includes('spec'));
  const hasUtils = [...pathSet].some(p => p.includes('/utils/') || p.includes('/helpers/'));
  const hasStyles = [...pathSet].some(p => p.includes('/styles/') || p.includes('.css'));
  const hasConfig = [...pathSet].some(p => p.includes('config') && (p.endsWith('.ts') || p.endsWith('.js')));

  let architecturePattern = 'Codebase';
  if (hasApi && hasServices && hasComponents) architecturePattern = 'Full-stack application';
  else if (hasApi && hasServices) architecturePattern = 'Backend service';
  else if (hasComponents && hasPages) architecturePattern = 'Frontend application';
  else if (hasComponents) architecturePattern = 'Component library';

  return (
    <ArchitectureView
      repositories={repositories.map(r => ({
        id: r.id, name: r.name, fullName: r.fullName,
        language: r.language, description: r.description,
        fileCount: r._count.files, symbolCount: r._count.symbols, depCount: r._count.dependencies,
      }))}
      dependencies={dependencies.map((d) => ({
        sourcePath: d.sourcePath,
        target: d.target,
        targetPath: d.targetPath,
        kind: d.kind,
        language: d.file.language,
      }))}
      symbols={symbols.map((s) => ({
        name: s.name,
        type: s.type,
        startLine: s.startLine,
        endLine: s.endLine,
        path: s.file.path,
        language: s.file.language,
      }))}
      topDirs={topDirs}
      frameworks={frameworks}
      architecturePattern={architecturePattern}
      appAreas={{ hasApi, hasComponents, hasPages, hasServices, hasTests, hasUtils, hasStyles, hasConfig }}
      totalFiles={allFiles.length}
    />
  );
}
