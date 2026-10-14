/**
 * POST /api/repositories/[id]/chat
 *
 * Streaming chat endpoint for repository Q&A.
 * Supports conversation history for multi-turn dialogues.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/db";
import { answerQuestionStream } from "@/lib/ai/rag";
import { estimateTokens } from "@/lib/ai/system-prompts";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Authenticate
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id as string;

    // 2. Validate repository access
    const { id: repositoryId } = await params;
    const repo = await prisma.repository.findFirst({
      where: { id: repositoryId, userId },
      select: { id: true, status: true, name: true },
    });

    if (!repo) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    if (repo.status !== "INDEXED") {
      return NextResponse.json(
        { error: "Repository is not indexed yet. Please wait for indexing to complete." },
        { status: 400 },
      );
    }

    // 2b. Rate limit: 10 requests per minute per user for AI calls
    const rl = rateLimit(`chat:${userId}`, { windowMs: 60_000, max: 10 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before sending another message." },
        { status: 429 },
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const { message, conversationId } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (message.length > 10000) {
      return NextResponse.json({ error: "Message too long (max 10,000 characters)" }, { status: 400 });
    }

    // 4. Get or create conversation
    let convId = conversationId;
    if (!convId) {
      const conv = await prisma.conversation.create({
        data: {
          repositoryId,
          userId,
          title: message.slice(0, 80),
        },
      });
      convId = conv.id;
    } else {
      // Verify conversation belongs to this user and repo
      const conv = await prisma.conversation.findFirst({
        where: { id: convId, userId, repositoryId },
      });
      if (!conv) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }
    }

    // 5. Save user message
    await prisma.message.create({
      data: {
        conversationId: convId,
        role: "user",
        content: message,
        tokenCount: estimateTokens(message),
      },
    });

    // 6. Load conversation history
    const history = await prisma.message.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: "asc" },
      take: 20, // Limit history
      select: { role: true, content: true },
    });

    // Build history without the last user message (which we'll send as the current question)
    const conversationHistory = history.slice(0, -1).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // 7. Set up streaming response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Write SSE events
    const writeEvent = async (event: string, data: string) => {
      await writer.write(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
    };

    // Start streaming in background
    (async () => {
      try {
        let fullAnswer = "";

        await answerQuestionStream(
          {
            repositoryId,
            userId,
            question: message,
            conversationHistory,
          },
          // onChunk
          async (chunk) => {
            fullAnswer += chunk;
            await writeEvent("chunk", chunk);
          },
          // onDone
          async (result) => {
            // Save assistant message
            await prisma.message.create({
              data: {
                conversationId: convId,
                role: "assistant",
                content: fullAnswer,
                evidence: result.evidence,
                tokenCount: estimateTokens(fullAnswer),
              },
            });

            // Send final event
            await writeEvent(
              "done",
              JSON.stringify({
                conversationId: convId,
                evidence: result.evidence,
                confidence: result.confidence,
                tokenUsage: result.tokenUsage,
              }),
            );

            await writer.close();
          },
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        await writeEvent("error", errorMessage);
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[chat] Error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/repositories/[id]/chat
 *
 * List conversations for a repository.
 */
export async function GET(
  request: NextRequest,
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
      select: { id: true },
    });

    if (!repo) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    const conversations = await prisma.conversation.findMany({
      where: { repositoryId, userId: session.user.id as string },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: { content: true },
        },
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json({
      conversations: conversations.map((c) => ({
        id: c.id,
        title: c.title,
        messageCount: c._count.messages,
        lastMessage: c.messages[0]?.content?.slice(0, 100) ?? null,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    });
  } catch (error) {
    console.error("[chat] List error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
