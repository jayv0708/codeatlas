/**
 * /repositories/[id]/chat
 *
 * AI-powered chat interface for asking questions about a repository.
 * Server component that loads repository info, then renders the client chat view.
 */

import { notFound, redirect } from "next/navigation";
import { auth } from "@/services/auth";
import { prisma } from "@/services/db";
import { ChatView } from "@/components/chat/chat-view";
import { repositoryInclude, toRepositorySummary } from "@/lib/repositories";

export const metadata = {
  title: "Chat — CodeAtlas",
  description: "Ask AI questions about your repository's code, architecture, and dependencies.",
};

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const repo = await prisma.repository.findFirst({
    where: { id, userId: session.user.id as string },
    include: repositoryInclude,
  });

  if (!repo) notFound();

  // Get all indexed repos for the selector
  const allRepos = await prisma.repository.findMany({
    where: { userId: session.user.id as string, status: "INDEXED" },
    include: repositoryInclude,
    orderBy: { updatedAt: "desc" },
  });

  return (
    <ChatView
      repositories={allRepos.map(toRepositorySummary)}
      user={{ name: session.user.name, image: session.user.image }}
    />
  );
}
