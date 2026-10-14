/**
 * CodeAtlas RAG Pipeline
 *
 * Orchestrates the full retrieval-augmented generation flow:
 * 1. Retrieve relevant code chunks (hybrid vector + full-text)
 * 2. Build concise context within token budget
 * 3. Call Claude with system prompt + evidence context
 * 4. Return structured answer with evidence citations
 */

import { getAIProvider } from "./providers";
import type { ChatMessage } from "./providers/types";
import { searchCode, type SearchResult } from "./vector-search";
import {
  RAG_SYSTEM_PROMPT,
  buildEvidenceContext,
  truncateEvidence,
} from "./system-prompts";
import { prisma } from "../db";
import { cacheGetOrSet } from "../cache";

export interface RagRequest {
  repositoryId: string;
  userId: string;
  question: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  maxChunks?: number;
}

export interface RagResponse {
  answer: string;
  evidence: Array<{
    file: string;
    lines: string;
    reason: string;
  }>;
  confidence: "high" | "medium" | "low";
  tokenUsage: {
    input: number;
    output: number;
  };
}

/**
 * Validate that the user owns the repository. Cached for 60s to avoid
 * repeated DB hits on multi-turn conversations.
 */
async function validateAccess(repositoryId: string, userId: string): Promise<boolean> {
  return cacheGetOrSet(
    `repo-access:${repositoryId}:${userId}`,
    async () => {
      const repo = await prisma.repository.findFirst({
        where: { id: repositoryId, userId },
        select: { id: true },
      });
      return repo !== null;
    },
    60, // 60-second TTL
  );
}

/**
 * Run the RAG pipeline for a single question.
 */
export async function answerQuestion(request: RagRequest): Promise<RagResponse> {
  const { repositoryId, userId, question, conversationHistory = [], maxChunks = 8 } = request;

  // Validate access
  const hasAccess = await validateAccess(repositoryId, userId);
  if (!hasAccess) {
    throw new Error("Repository not found or access denied");
  }

  // 1. Retrieve relevant chunks
  const chunks = await searchCode({
    repositoryId,
    query: question,
    limit: maxChunks,
    minScore: 0.05,
  });

  // 2. Build evidence context within token budget
  const evidenceChunks = truncateEvidence(chunks);
  const evidenceContext = buildEvidenceContext(evidenceChunks);

  // 3. Build conversation messages
  const messages: ChatMessage[] = [];

  // Add conversation history (limited to last 6 turns)
  const recentHistory = conversationHistory.slice(-6);
  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }

  // Add current question with evidence context
  const userMessage = `## Evidence Context\n\n${evidenceContext}\n\n## Question\n\n${question}`;
  messages.push({ role: "user", content: userMessage });

  // 4. Call AI provider
  const provider = getAIProvider();
  const response = await provider.chat({
    messages,
    system: RAG_SYSTEM_PROMPT,
    maxTokens: 2048,
  });

  const answer = response.content;

  // 5. Extract evidence citations from the answer
  const evidence = extractEvidence(answer, evidenceChunks);

  // 6. Determine confidence based on evidence quality
  const confidence = determineConfidence(chunks, answer);

  return {
    answer,
    evidence,
    confidence,
    tokenUsage: {
      input: response.usage.input,
      output: response.usage.output,
    },
  };
}

/**
 * Run the RAG pipeline as a streaming response.
 */
export async function answerQuestionStream(
  request: RagRequest,
  onChunk: (text: string) => void,
  onDone: (response: Omit<RagResponse, "answer">) => void,
): Promise<void> {
  const { repositoryId, userId, question, conversationHistory = [], maxChunks = 8 } = request;

  // Validate access
  const hasAccess = await validateAccess(repositoryId, userId);
  if (!hasAccess) {
    throw new Error("Repository not found or access denied");
  }

  // 1. Retrieve relevant chunks
  const chunks = await searchCode({
    repositoryId,
    query: question,
    limit: maxChunks,
    minScore: 0.05,
  });

  // 2. Build evidence context
  const evidenceChunks = truncateEvidence(chunks);
  const evidenceContext = buildEvidenceContext(evidenceChunks);

  // 3. Build messages
  const messages: ChatMessage[] = [];
  const recentHistory = conversationHistory.slice(-6);
  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }
  const userMessage = `## Evidence Context\n\n${evidenceContext}\n\n## Question\n\n${question}`;
  messages.push({ role: "user", content: userMessage });

  // 4. Call AI provider with streaming
  const provider = getAIProvider();
  let fullAnswer = "";

  await provider.chatStream(
    {
      messages,
      system: RAG_SYSTEM_PROMPT,
      maxTokens: 2048,
    },
    {
      onChunk: (chunk) => {
        fullAnswer += chunk;
        onChunk(chunk);
      },
      onDone: (usage) => {
        const evidence = extractEvidence(fullAnswer, evidenceChunks);
        const confidence = determineConfidence(chunks, fullAnswer);
        onDone({ evidence, confidence, tokenUsage: usage });
      },
      onError: (error) => {
        throw error;
      },
    },
  );
}

/**
 * Extract evidence citations from the answer text.
 */
function extractEvidence(
  answer: string,
  chunks: SearchResult[],
): Array<{ file: string; lines: string; reason: string }> {
  const evidence: Array<{ file: string; lines: string; reason: string }> = [];

  // Find file path references in the answer (e.g., src/auth/service.ts, lines 20-45)
  const filePattern = /([a-zA-Z0-9_\-./]+\.(?:ts|tsx|js|jsx|java|py|go|rs|cpp|c|h|css|html|json|yaml|yml|md|sql))\s*(?:\((?:lines?\s*)?(\d+)[\s\-—]+(\d+)\))?/gi;

  let match;
  while ((match = filePattern.exec(answer)) !== null) {
    const filePath = match[1];
    const startLine = match[2] ?? "";
    const endLine = match[3] ?? "";
    const lines = startLine && endLine ? `lines ${startLine}-${endLine}` : "";

    // Find the matching chunk
    const chunk = chunks.find(
      (c) => c.path === filePath || filePath.endsWith(c.path),
    );

    evidence.push({
      file: filePath,
      lines,
      reason: chunk?.symbolName
        ? `${chunk.chunkType} \`${chunk.symbolName}\``
        : `Referenced in answer`,
    });
  }

  // Deduplicate by file path
  const seen = new Set<string>();
  return evidence.filter((e) => {
    if (seen.has(e.file)) return false;
    seen.add(e.file);
    return true;
  });
}

/**
 * Determine confidence based on evidence quality and answer content.
 */
function determineConfidence(
  chunks: SearchResult[],
  answer: string,
): "high" | "medium" | "low" {
  // No evidence found
  if (chunks.length === 0) return "low";

  // Check for hedging language
  const hedgingPatterns = [
    /not enough evidence/i,
    /cannot determine/i,
    /unable to find/i,
    /insufficient/i,
    /not clear/i,
    /may be/i,
    /possibly/i,
  ];
  const hasHedging = hedgingPatterns.some((p) => p.test(answer));

  if (hasHedging) return "medium";

  // High confidence: strong matches + substantial answer
  const avgScore = chunks.reduce((sum, c) => sum + c.score, 0) / chunks.length;
  if (avgScore > 0.3 && chunks.length >= 2 && answer.length > 200) return "high";

  // Medium: decent evidence
  if (avgScore > 0.15 || chunks.length >= 1) return "medium";

  return "low";
}
