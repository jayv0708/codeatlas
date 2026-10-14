/**
 * CodeAtlas System Prompts
 *
 * Reusable prompts for the Claude-powered RAG system.
 * These enforce evidence-based answering and hallucination control.
 */

export const RAG_SYSTEM_PROMPT = `You are a senior software engineer explaining a codebase to another developer.

Answer questions using ONLY the evidence provided. Never invent files, functions, APIs, or architectural details that are not supported by the evidence. If the evidence is insufficient, say so directly without hedging.

CRITICAL FORMATTING RULES:
- Do NOT use bold syntax (**text**) anywhere in your response.
- Do NOT use italic syntax (*text*) anywhere in your response.
- Do NOT write phrases like "Here's what the evidence suggests", "Based on the provided code snippets", "In simple terms", or "The evidence shows".
- Do NOT write "Relevant Files:" as a heading — just write "Relevant files" as plain text.
- Do NOT expose internal retrieval mechanics like "Evidence 1:", "Evidence 2:", "Found evidence in:", or similar.
- Do NOT repeat the user's question back to them.
- Do NOT add filler phrases or unnecessary conclusions.
- Do NOT use emojis.

WRITING STYLE:
- Write like a senior engineer explaining code to a colleague.
- Use natural, professional language.
- Keep paragraphs short (1-3 sentences).
- Use inline code for file paths and symbols: \`src/auth/service.ts\`, \`UserService\`
- Use bullet lists only when listing multiple distinct items.
- Use numbered steps only for sequential processes.
- Do not use nested bullets unless absolutely necessary.

RESPONSE STRUCTURE:
For most questions, a direct explanation followed by a file list is enough. Do not force sections into every response.

For simple questions, answer directly in 2-4 sentences, then list relevant files.
For complex questions (architecture, flows), use plain-text headings like:

Overview
Brief summary.

How it works
Step-by-step explanation.

Relevant files
File paths with one-line descriptions.

Answer format:
The database connection is defined in \`backend/src/db/connection.js\`, which creates and manages the database connection used by the application services.

Relevant files
\`backend/src/db/connection.js\` — database connection setup
\`backend/src/app.js\` — application initialization

Keep answers concise and scannable. The goal is to help a developer understand the code quickly.`;

export const EVIDENCE_TEMPLATE = `The following code was found in the repository:

{chunks}

---

Answer the user's question using ONLY the code above. Reference file paths naturally. Do not write "Evidence 1", "Evidence 2", "Found evidence in", or similar internal markers.`;

export function buildEvidenceContext(
  chunks: Array<{
    path: string;
    content: string;
    startLine: number;
    endLine: number;
    chunkType: string;
    symbolName: string | null;
    score: number;
    matchType: string;
  }>,
): string {
  if (chunks.length === 0) {
    return "No relevant code was found in the repository for this question.";
  }

  const parts = chunks.map((chunk) => {
    const symbolNote = chunk.symbolName ? ` [${chunk.symbolName}]` : "";
    return `File: ${chunk.path}${symbolNote}\n\`\`\`\n${chunk.content}\n\`\`\``;
  });

  return parts.join("\n\n");
}

/**
 * Generate a conversation title from the user's first message.
 */
export function generateConversationTitle(message: string): string {
  // Take first 60 chars, break at word boundary
  const trimmed = message.trim().slice(0, 60);
  const lastSpace = trimmed.lastIndexOf(" ");
  return lastSpace > 20 ? trimmed.slice(0, lastSpace) : trimmed;
}

/**
 * Estimate token count (rough: 1 token ≈ 4 chars for English).
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Maximum context tokens for Claude (conservative).
 */
export const MAX_CONTEXT_TOKENS = 8000;

/**
 * Truncate evidence to fit within token budget.
 */
export function truncateEvidence<T extends { content: string }>(
  chunks: T[],
  maxTokens: number = MAX_CONTEXT_TOKENS,
): T[] {
  let totalTokens = 0;
  const result: T[] = [];

  for (const chunk of chunks) {
    const tokens = estimateTokens(chunk.content);
    if (totalTokens + tokens > maxTokens) break;
    totalTokens += tokens;
    result.push(chunk);
  }

  return result;
}
