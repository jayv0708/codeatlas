import { DashboardView } from "@/components/dashboard/dashboard-view";
import { safeSession } from "@/lib/session";
import { repositoryInclude, toRepositorySummary, type RepositoryWithStats } from "@/lib/repositories";
import { prisma } from "@/services/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await safeSession();

  let repositories: RepositoryWithStats[] = [];
  let indexedFiles = 0;
  let dependencies = 0;
  let totalCount = 0;

  if (session?.user?.id) {
    try {
      [repositories, indexedFiles, dependencies] = await Promise.all([
        prisma.repository.findMany({
          where: { userId: session.user.id },
          include: repositoryInclude,
          orderBy: { updatedAt: "desc" },
          take: 5,
        }),
        prisma.repoFile.count({ where: { repository: { userId: session.user.id } } }),
        prisma.dependency.count({ where: { repository: { userId: session.user.id } } }),
      ]);

      totalCount = await prisma.repository.count({ where: { userId: session.user.id } });
    } catch {
      // Database may be temporarily unreachable — show dashboard with empty data
    }
  }

  return (
    <DashboardView
      user={{ name: session?.user?.name ?? null }}
      stats={{
        repositories: totalCount,
        aiInsights: 0,
        indexedFiles,
        dependencies,
      }}
      repositories={repositories.map(toRepositorySummary)}
    />
  );
}
