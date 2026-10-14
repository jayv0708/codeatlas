import type { Metadata } from "next";

import { safeSession } from "@/lib/session";
import { prisma } from "@/services/db";
import { ImpactView } from "@/components/impact/impact-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Impact Analysis — CodeAtlas",
  robots: { index: false, follow: false },
};

export default async function ImpactPage() {
  const session = await safeSession();

  if (!session?.user?.id) {
    return <ImpactView repositories={[]} symbols={[]} dependencies={[]} />;
  }

  const userId = session.user.id;
  const whereIndexed = { repository: { userId, status: "INDEXED" } };

  let repositories: { id: string; name: string; fullName: string | null }[] = [];
  let symbols: { id: string; name: string; type: string; startLine: number; endLine: number; file: { path: string }; repository: { name: string } }[] = [];
  let dependencies: { sourcePath: string; target: string; targetPath: string | null; kind: string }[] = [];

  try {
    [repositories, symbols, dependencies] = await Promise.all([
      prisma.repository.findMany({
        where: { userId, status: "INDEXED" },
        select: { id: true, name: true, fullName: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.symbol.findMany({
        where: { ...whereIndexed, type: { in: ["class", "function", "interface"] } },
        select: {
          id: true,
          name: true,
          type: true,
          startLine: true,
          endLine: true,
          file: { select: { path: true } },
          repository: { select: { name: true } },
        },
        orderBy: { name: "asc" },
        take: 200,
      }),
      prisma.dependency.findMany({
        where: whereIndexed,
        select: {
          sourcePath: true,
          target: true,
          targetPath: true,
          kind: true,
        },
        take: 2000,
      }),
    ]);
  } catch {
    // DB may be temporarily unreachable
  }

  return (
    <ImpactView
      repositories={repositories}
      symbols={symbols.map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        path: s.file.path,
        startLine: s.startLine,
        endLine: s.endLine,
        repoName: s.repository.name,
      }))}
      dependencies={dependencies}
    />
  );
}
