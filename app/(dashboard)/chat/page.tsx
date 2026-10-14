import type { Metadata } from "next";

import { safeSession } from "@/lib/session";
import { repositoryInclude, toRepositorySummary } from "@/lib/repositories";
import { prisma } from "@/services/db";
import { ChatView } from "@/components/chat/chat-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Chat — CodeAtlas",
  robots: { index: false, follow: false },
};

export default async function ChatPage() {
  const session = await safeSession();

  let repositories: Awaited<ReturnType<typeof toRepositorySummary>>[] = [];
  if (session?.user?.id) {
    try {
      const rows = await prisma.repository.findMany({
        where: { userId: session.user.id, status: "INDEXED" },
        include: repositoryInclude,
        orderBy: { updatedAt: "desc" },
      });
      repositories = rows.map(toRepositorySummary);
    } catch {
      // DB may be temporarily unreachable
    }
  }

  return (
    <ChatView
      repositories={repositories}
      user={{ name: session?.user?.name ?? null, image: session?.user?.image ?? null }}
    />
  );
}
