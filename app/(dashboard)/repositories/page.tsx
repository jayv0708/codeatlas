import type { Metadata } from "next";

import { PageHeader } from "@/components/dashboard/page-header";
import { RepositoriesView } from "@/components/repositories/repositories-view";
import { safeSession } from "@/lib/session";
import { repositoryInclude, toRepositorySummary } from "@/lib/repositories";
import { prisma } from "@/services/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function RepositoriesPage() {
  const session = await safeSession();

  let repositories: Awaited<ReturnType<typeof toRepositorySummary>>[] = [];
  if (session?.user?.id) {
    try {
      const rows = await prisma.repository.findMany({
        where: { userId: session.user.id },
        include: repositoryInclude,
        orderBy: { updatedAt: "desc" },
      });
      repositories = rows.map(toRepositorySummary);
    } catch (error) {
      console.error("[ReposPage] Failed to load repositories:", error instanceof Error ? error.message : error);
      // Continue with empty list — the connect dialog still works
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Repositories"
        description="Connect and manage the GitHub repositories CodeAtlas understands."
      />
      <RepositoriesView initialRepositories={repositories} />
    </div>
  );
}
