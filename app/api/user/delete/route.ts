import { NextResponse } from "next/server";

import { auth } from "@/services/auth";
import { prisma } from "@/services/db";

export async function DELETE() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete the user — all related records cascade via onDelete: Cascade
    // User → Accounts, Sessions, Repositories, Conversations
    // Repository → RepoFile → Symbol, Dependency, CodeChunk → Embedding
    // Repository → IngestionJob
    // Conversation → Message
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Delete Account] Failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
