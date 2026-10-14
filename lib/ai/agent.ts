/**
 * CodeAtlas AI Agent
 *
 * Turns CodeAtlas into a controlled AI agent that Claude can invoke tools on.
 * Claude decides which tool to call based on the user's question, we validate
 * the arguments, enforce repository isolation, execute the tool, and return
 * evidence. Claude then generates a final answer.
 *
 * Tools available:
 *   - searchCode: search indexed code chunks
 *   - getFile: fetch a file's content and symbols
 *   - findDependencies: find what a file depends on and what depends on it
 *   - searchCommits: search git commit history
 *   - analyzeImpact: analyze impact of changing a component
 */

import { getAIProvider } from "./providers";
import type { ChatMessage, ToolResultBlock } from "./providers/types";
import { prisma } from "@/services/db";
import { searchCode } from "./vector-search";
import { getGitHubTokenForUser } from "@/lib/github";
import { RAG_SYSTEM_PROMPT } from "./system-prompts";

// ── Tool definitions ────────────────────────────────────────────────────────

import type { ToolDefinition } from "./providers/types";

export const AGENT_TOOLS: ToolDefinition[] = [
  {
    name: "searchCode",
    description:
      "Search the repository's indexed code for relevant chunks. Returns file paths, line ranges, symbol names, and relevance scores. Use this to find code related to a concept, function, or feature.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Natural language search query (e.g. 'authentication middleware')",
        },
        limit: {
          type: "number",
          description: "Max results to return (default 5, max 15)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "getFile",
    description:
      "Get the full content and symbols of a specific file. Returns the file content, all symbols (classes, functions, methods), and import/export information.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "File path in the repository (e.g. 'src/services/auth.ts')",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "findDependencies",
    description:
      "Find what a file depends on (imports) and what depends on it (is imported by). Returns dependency chains.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "File path to analyze",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "searchCommits",
    description:
      "Search git commit history for commits related to a file or topic. Returns commit SHAs, messages, authors, and dates.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "Optional file path to filter commits",
        },
        query: {
          type: "string",
          description: "Optional search term to filter commit messages",
        },
      },
      required: [],
    },
  },
  {
    name: "analyzeImpact",
    description:
      "Analyze the impact of changing a component or file. Returns affected files, dependents, APIs, and an impact level.",
    input_schema: {
      type: "object" as const,
      properties: {
        target: {
          type: "string",
          description: "Symbol name or file path to analyze",
        },
      },
      required: ["target"],
    },
  },
];

// ── Tool implementations ────────────────────────────────────────────────────

interface ToolResult {
  tool: string;
  result: string;
  evidence: Array<{ file: string; lines?: string; reason: string }>;
}

async function executeSearchCode(
  repositoryId: string,
  args: { query: string; limit?: number },
): Promise<ToolResult> {
  const limit = Math.min(Math.max(args.limit ?? 5, 1), 15);
  const results = await searchCode({
    repositoryId,
    query: args.query,
    limit,
    minScore: 0.05,
  });

  if (results.length === 0) {
    return {
      tool: "searchCode",
      result: `No code found matching "${args.query}" in the repository.`,
      evidence: [],
    };
  }

  const evidence = results.map((r) => ({
    file: r.path,
    lines: `${r.startLine}-${r.endLine}`,
    reason: r.symbolName
      ? `${r.chunkType} \`${r.symbolName}\` (${Math.round(r.score * 100)}% match)`
      : `${r.chunkType} (${Math.round(r.score * 100)}% match)`,
  }));

  const resultText = results
    .map(
      (r) =>
        `- ${r.path} (${r.startLine}-${r.endLine}): ${r.symbolName ?? r.chunkType} [${r.matchType} match, ${Math.round(r.score * 100)}%]`,
    )
    .join("\n");

  return { tool: "searchCode", result: resultText, evidence };
}

async function executeGetFile(
  repositoryId: string,
  args: { path: string },
): Promise<ToolResult> {
  const file = await prisma.repoFile.findFirst({
    where: { repositoryId, path: args.path },
    include: {
      symbols: {
        select: { name: true, type: true, startLine: true, endLine: true },
        orderBy: { startLine: "asc" },
      },
    },
  });

  if (!file) {
    return {
      tool: "getFile",
      result: `File "${args.path}" not found in the repository.`,
      evidence: [],
    };
  }

  const symbols = file.symbols
    .map(
      (s) =>
        `  - ${s.type} ${s.name} (lines ${s.startLine}-${s.endLine})`,
    )
    .join("\n");

  const content = file.content ?? "(content not available)";
  const truncated = content.length > 4000 ? content.slice(0, 4000) + "\n...(truncated)" : content;

  return {
    tool: "getFile",
    result: `File: ${file.path}\nLanguage: ${file.language ?? "unknown"}\nSize: ${file.size} bytes\n\nSymbols:\n${symbols || "  (none extracted)"}\n\nContent:\n\`\`\`\n${truncated}\n\`\`\``,
    evidence: [{ file: file.path, reason: "File content retrieved" }],
  };
}

async function executeFindDependencies(
  repositoryId: string,
  args: { path: string },
): Promise<ToolResult> {
  const file = await prisma.repoFile.findFirst({
    where: { repositoryId, path: args.path },
    select: { id: true, path: true },
  });

  if (!file) {
    return {
      tool: "findDependencies",
      result: `File "${args.path}" not found in the repository.`,
      evidence: [],
    };
  }

  // What this file imports
  const imports = await prisma.dependency.findMany({
    where: { repositoryId, fileId: file.id },
    select: { target: true, targetPath: true, kind: true },
  });

  // What imports this file
  const importedBy = await prisma.dependency.findMany({
    where: { repositoryId, targetPath: file.path },
    select: { sourcePath: true, kind: true, file: { select: { path: true } } },
  });

  const importLines = imports
    .map((d) => `  - ${d.target}${d.targetPath ? ` → ${d.targetPath}` : ""} (${d.kind})`)
    .join("\n");

  const importedByLines = importedBy
    .map((d) => `  - ${d.file.path} imports this (${d.kind})`)
    .join("\n");

  const evidence = [
    { file: file.path, reason: "Target file" },
    ...imports.filter((d) => d.targetPath).map((d) => ({
      file: d.targetPath!,
      reason: `Imported by ${file.path}`,
    })),
    ...importedBy.map((d) => ({
      file: d.file.path,
      reason: `Imports ${file.path}`,
    })),
  ];

  return {
    tool: "findDependencies",
    result: `Dependencies of ${file.path}:\n${importLines || "  (none found)"}\n\nImported by:\n${importedByLines || "  (nothing imports this file)"}`,
    evidence,
  };
}

async function executeSearchCommits(
  repositoryId: string,
  args: { path?: string; query?: string },
  userId: string,
): Promise<ToolResult> {
  const repo = await prisma.repository.findFirst({
    where: { id: repositoryId },
    select: { fullName: true, defaultBranch: true },
  });

  if (!repo?.fullName) {
    return {
      tool: "searchCommits",
      result: "Repository has no GitHub connection.",
      evidence: [],
    };
  }

  const tokenInfo = await getGitHubTokenForUser(userId);
  if (!tokenInfo) {
    return {
      tool: "searchCommits",
      result: "GitHub token not available. Please sign in again.",
      evidence: [],
    };
  }

  const branch = repo.defaultBranch ?? "main";
  let url = `https://api.github.com/repos/${repo.fullName}/commits?sha=${branch}&per_page=10`;
  if (args.path) url += `&path=${encodeURIComponent(args.path)}`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${tokenInfo.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "CodeAtlas",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return {
      tool: "searchCommits",
      result: `Failed to fetch commits from GitHub (HTTP ${res.status}).`,
      evidence: [],
    };
  }

  let commits = (await res.json()) as Array<{
    sha: string;
    commit: { message: string; author: { name: string; date: string } };
    html_url: string;
  }>;

  // Filter by query if provided
  if (args.query) {
    const q = args.query.toLowerCase();
    commits = commits.filter((c) => c.commit.message.toLowerCase().includes(q));
  }

  if (commits.length === 0) {
    return {
      tool: "searchCommits",
      result: `No commits found${args.path ? ` for ${args.path}` : ""}${args.query ? ` matching "${args.query}"` : ""}.`,
      evidence: [],
    };
  }

  const commitLines = commits
    .map(
      (c) =>
        `- \`${c.sha.slice(0, 7)}\` ${c.commit.message.split("\n")[0]} (${c.commit.author.name}, ${c.commit.author.date.slice(0, 10)})`,
    )
    .join("\n");

  const evidence = commits.slice(0, 5).map((c) => ({
    file: args.path ?? "repository",
    reason: `Commit ${c.sha.slice(0, 7)}: ${c.commit.message.split("\n")[0]}`,
  }));

  return {
    tool: "searchCommits",
    result: `Recent commits${args.path ? ` for ${args.path}` : ""}:\n${commitLines}`,
    evidence,
  };
}

async function executeAnalyzeImpact(
  repositoryId: string,
  args: { target: string },
): Promise<ToolResult> {
  // Find matching symbols
  const matchingSymbols = await prisma.symbol.findMany({
    where: {
      repositoryId,
      OR: [
        { name: { contains: args.target, mode: "insensitive" } },
        { file: { path: { contains: args.target, mode: "insensitive" } } },
      ],
    },
    select: {
      name: true,
      type: true,
      file: { select: { path: true } },
    },
    take: 10,
  });

  const matchingFiles = await prisma.repoFile.findMany({
    where: { repositoryId, path: { contains: args.target, mode: "insensitive" } },
    select: { id: true, path: true },
    take: 5,
  });

  const targetFileIds = new Set(matchingSymbols.map((s) => s.file.path));
  for (const f of matchingFiles) targetFileIds.add(f.path);

  if (targetFileIds.size === 0) {
    return {
      tool: "analyzeImpact",
      result: `No files or symbols matching "${args.target}" found.`,
      evidence: [],
    };
  }

  // Find dependents
  const dependents = await prisma.dependency.findMany({
    where: {
      repositoryId,
      targetPath: { in: [...targetFileIds] },
    },
    select: { file: { select: { path: true } }, kind: true },
    take: 30,
  });

  const impactLines = [
    `Target: "${args.target}"`,
    `Matching files: ${[...targetFileIds].join(", ")}`,
    `Direct dependents: ${dependents.length}`,
    "",
    ...dependents.map((d) => `  - ${d.file.path} (${d.kind})`),
  ];

  const level = dependents.length > 5 ? "HIGH" : dependents.length > 2 ? "MEDIUM" : "LOW";
  impactLines.push("", `Impact level: ${level}`);

  const evidence = [
    ...[...targetFileIds].map((f) => ({ file: f, reason: "Target file" })),
    ...dependents.slice(0, 10).map((d) => ({
      file: d.file.path,
      reason: `Depends on ${args.target}`,
    })),
  ];

  return {
    tool: "analyzeImpact",
    result: impactLines.join("\n"),
    evidence,
  };
}

// ── Agent loop ──────────────────────────────────────────────────────────────

export interface AgentRequest {
  repositoryId: string;
  userId: string;
  question: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  onToolCall?: (tool: string, args: Record<string, unknown>) => void;
  onToolResult?: (tool: string, result: string) => void;
  onChunk?: (text: string) => void;
}

export interface AgentResponse {
  answer: string;
  evidence: Array<{ file: string; lines?: string; reason: string }>;
  toolsUsed: string[];
  tokenUsage: { input: number; output: number };
}

const AGENT_SYSTEM_PROMPT = `${RAG_SYSTEM_PROMPT}

You have access to tools that can search the repository's code, files, dependencies,
git history, and impact analysis. Use these tools to answer questions accurately.

RULES FOR TOOL USE:
1. Always use tools to find evidence before answering. Do not guess.
2. You may call multiple tools in sequence to build a complete picture.
3. If the first search doesn't find enough, try different queries.
4. After gathering evidence, synthesize a clear answer citing specific files and lines.
5. When analyzing impact, check both direct and indirect dependencies.
6. Never claim a tool was executed if it failed.
7. If tools return no evidence, say so clearly.
8. Maximum 5 tool calls per question to control costs.`;

export async function runAgent(request: AgentRequest): Promise<AgentResponse> {
  const { repositoryId, userId, question, conversationHistory = [] } = request;

  // Validate access
  const repo = await prisma.repository.findFirst({
    where: { id: repositoryId, userId },
    select: { id: true, status: true },
  });
  if (!repo) throw new Error("Repository not found or access denied");
  if (repo.status !== "INDEXED") throw new Error("Repository is not indexed yet");

  const provider = getAIProvider();

  // Build initial messages
  const messages: ChatMessage[] = [];
  const recentHistory = conversationHistory.slice(-6);
  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }
  messages.push({ role: "user", content: question });

  const allEvidence: Array<{ file: string; lines?: string; reason: string }> = [];
  const toolsUsed: string[] = [];
  let totalInput = 0;
  let totalOutput = 0;
  const MAX_TOOL_ROUNDS = 5;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await provider.agentChat({
      messages,
      system: AGENT_SYSTEM_PROMPT,
      tools: AGENT_TOOLS,
      maxTokens: 2048,
    });

    totalInput += response.usage.input;
    totalOutput += response.usage.output;

    // Check if the provider wants to use tools
    const toolBlocks = response.content.filter((b) => b.type === "tool_use");
    const textBlocks = response.content.filter((b) => b.type === "text");

    if (toolBlocks.length === 0) {
      // No more tool calls — done
      const answer = textBlocks.map((b) => b.type === "text" ? b.text : "").join("\n");
      return {
        answer,
        evidence: allEvidence,
        toolsUsed,
        tokenUsage: { input: totalInput, output: totalOutput },
      };
    }

    // Add assistant message with tool calls
    messages.push({ role: "assistant", content: JSON.stringify(response.content) });

    // Execute each tool call
    const toolResults: ToolResultBlock[] = [];

    for (const toolBlock of toolBlocks) {
      if (toolBlock.type !== "tool_use") continue;
      const toolName = toolBlock.name;
      const toolArgs = toolBlock.input;
      toolsUsed.push(toolName);
      request.onToolCall?.(toolName, toolArgs);

      let result: ToolResult;
      try {
        switch (toolName) {
          case "searchCode":
            result = await executeSearchCode(repositoryId, toolArgs as { query: string; limit?: number });
            break;
          case "getFile":
            result = await executeGetFile(repositoryId, toolArgs as { path: string });
            break;
          case "findDependencies":
            result = await executeFindDependencies(repositoryId, toolArgs as { path: string });
            break;
          case "searchCommits":
            result = await executeSearchCommits(repositoryId, toolArgs as { path?: string; query?: string }, userId);
            break;
          case "analyzeImpact":
            result = await executeAnalyzeImpact(repositoryId, toolArgs as { target: string });
            break;
          default:
            result = { tool: toolName, result: `Unknown tool: ${toolName}`, evidence: [] };
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Tool execution failed";
        result = { tool: toolName, result: `Error: ${msg}`, evidence: [] };
      }

      allEvidence.push(...result.evidence);
      request.onToolResult?.(toolName, result.result);

      toolResults.push({
        type: "tool_result",
        tool_use_id: toolBlock.id,
        content: result.result,
      });
    }

    // Add tool results as user message
    messages.push({ role: "user", content: JSON.stringify(toolResults) });
  }

  // If we exhaust tool rounds, generate final answer
  const finalResponse = await provider.chat({
    messages: [...messages, { role: "user", content: "Please provide your final answer now based on the evidence gathered." }],
    system: AGENT_SYSTEM_PROMPT,
    maxTokens: 2048,
  });

  totalInput += finalResponse.usage.input;
  totalOutput += finalResponse.usage.output;

  return {
    answer: finalResponse.content,
    evidence: allEvidence,
    toolsUsed,
    tokenUsage: { input: totalInput, output: totalOutput },
  };
}

/**
 * Streaming version of the agent loop.
 */
export async function runAgentStream(
  request: AgentRequest,
): Promise<void> {
  const { repositoryId, userId, question, conversationHistory = [], onChunk, onToolCall, onToolResult } = request;

  const repo = await prisma.repository.findFirst({
    where: { id: repositoryId, userId },
    select: { id: true, status: true },
  });
  if (!repo) throw new Error("Repository not found or access denied");
  if (repo.status !== "INDEXED") throw new Error("Repository is not indexed yet");

  const provider = getAIProvider();
  const messages: ChatMessage[] = [];
  const recentHistory = conversationHistory.slice(-6);
  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }
  messages.push({ role: "user", content: question });

  const MAX_TOOL_ROUNDS = 5;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    // Use agentChat to get the response (provider handles internally)
    const response = await provider.agentChat({
      messages,
      system: AGENT_SYSTEM_PROMPT,
      tools: AGENT_TOOLS,
      maxTokens: 2048,
    });

    const toolBlocks = response.content.filter((b) => b.type === "tool_use");
    const textBlocks = response.content.filter((b) => b.type === "text");

    // Stream text content
    for (const block of textBlocks) {
      if (block.type === "text" && block.text) {
        onChunk?.(block.text);
      }
    }

    if (toolBlocks.length === 0) {
      return; // Done
    }

    // Add assistant message
    messages.push({ role: "assistant", content: JSON.stringify(response.content) });

    // Execute tools
    const toolResults: ToolResultBlock[] = [];
    for (const tb of toolBlocks) {
      if (tb.type !== "tool_use") continue;
      onToolCall?.(tb.name, tb.input);
      let result: ToolResult;
      try {
        switch (tb.name) {
          case "searchCode":
            result = await executeSearchCode(repositoryId, tb.input as { query: string; limit?: number });
            break;
          case "getFile":
            result = await executeGetFile(repositoryId, tb.input as { path: string });
            break;
          case "findDependencies":
            result = await executeFindDependencies(repositoryId, tb.input as { path: string });
            break;
          case "searchCommits":
            result = await executeSearchCommits(repositoryId, tb.input as { path?: string; query?: string }, userId);
            break;
          case "analyzeImpact":
            result = await executeAnalyzeImpact(repositoryId, tb.input as { target: string });
            break;
          default:
            result = { tool: tb.name, result: `Unknown tool: ${tb.name}`, evidence: [] };
        }
      } catch (err) {
        result = { tool: tb.name, result: `Error: ${err instanceof Error ? err.message : "failed"}`, evidence: [] };
      }
      onToolResult?.(tb.name, result.result);
      toolResults.push({ type: "tool_result", tool_use_id: tb.id, content: result.result });
    }

    messages.push({ role: "user", content: JSON.stringify(toolResults) });
  }
}
