import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RepositoryDetailView } from "@/components/repositories/repository-detail-view";
import { getRepositoryDetail } from "@/lib/repositories";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function RepositoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  const detail = await getRepositoryDetail(id, session.user.id);
  if (!detail) {
    notFound();
  }

  return <RepositoryDetailView initialDetail={detail} />;
}
