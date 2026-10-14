/**
 * CodeAtlas Code Chunker
 *
 * Splits source files into semantic chunks based on parsed symbols.
 * Each chunk is a meaningful unit of code (function, class, module section)
 * rather than an arbitrary text split.
 *
 * The chunker uses Phase 3's parser output (symbols with line ranges) to
 * create well-defined chunks with full context.
 */

import { createHash } from "crypto";

export interface ChunkInput {
  fileId: string;
  repositoryId: string;
  path: string;
  language: string | null;
  content: string;
}

export interface CodeChunk {
  fileId: string;
  repositoryId: string;
  path: string;
  language: string | null;
  chunkType: string; // function | class | module | block | header
  symbolName: string | null;
  content: string;
  startLine: number;
  endLine: number;
  tokenCount: number;
  hash: string;
}

/**
 * Count tokens roughly (whitespace-separated words + code symbols).
 */
function countTokens(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Simple SHA-256 hash for dedup.
 */
function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

/**
 * Detect if a line looks like a function/method declaration.
 */
function isFunctionStart(line: string, language: string | null): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) {
    return false;
  }

  if (language === "java") {
    // Java: public/private/protected/static ... methodName(
    return /(?:public|private|protected|static|final|abstract|synchronized|native)\s+.*\w+\s*\(/.test(trimmed);
  }

  // TypeScript/JavaScript:
  // function name(
  // const name = (
  // const name = async (
  // export function name(
  // export default function name(
  if (/^(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+\w+/.test(trimmed)) return true;
  if (/^(?:export\s+)?const\s+\w+\s*=\s*(?:async\s+)?\(/.test(trimmed)) return true;
  if (/^(?:export\s+)?const\s+\w+\s*=\s*(?:async\s+)?function/.test(trimmed)) return true;
  // Arrow function assigned to const
  if (/^(?:export\s+)?const\s+\w+\s*=\s*(?:async\s+)?\w+\s*=>/.test(trimmed)) return true;

  return false;
}

/**
 * Detect if a line looks like a class/interface declaration.
 */
function isClassStart(line: string, language: string | null): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  if (language === "java") {
    return /^(?:public|private|protected|abstract|final)?\s*(?:class|interface|enum)\s+\w+/.test(trimmed);
  }

  // TypeScript/JavaScript
  return /^(?:export\s+)?(?:default\s+)?(?:abstract\s+)?(?:class|interface)\s+\w+/.test(trimmed);
}

/**
 * Find the matching closing brace for an opening brace at `startLine`.
 * Returns the line number of the closing brace, or null if not found.
 */
function findClosingBrace(lines: string[], startLine: number): number | null {
  let depth = 0;
  let foundOpen = false;

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    for (const ch of line) {
      if (ch === "{") {
        depth++;
        foundOpen = true;
      } else if (ch === "}") {
        depth--;
        if (foundOpen && depth === 0) {
          return i;
        }
      }
    }
  }

  return null;
}

/**
 * Chunk a source file into semantic pieces.
 *
 * Strategy:
 * 1. If the file has symbols from the parser, use their line ranges
 * 2. Otherwise, fall back to brace-based splitting
 * 3. Always include a "header" chunk with imports/exports
 */
export function chunkFile(input: ChunkInput, symbols?: Array<{
  name: string;
  type: string;
  startLine: number;
  endLine: number;
}>): CodeChunk[] {
  const lines = input.content.split("\n");
  const chunks: CodeChunk[] = [];
  const maxChunkLines = 200; // Safety: don't create mega-chunks
  const maxTokenCount = 2000;

  // If we have parsed symbols, use them to guide chunking
  if (symbols && symbols.length > 0) {
    // Extract header (imports, type definitions) up to the first symbol
    const firstSymbolLine = Math.min(...symbols.map((s) => s.startLine));
    if (firstSymbolLine > 1) {
      const headerLines = lines.slice(0, Math.min(firstSymbolLine - 1, 50));
      const headerContent = headerLines.join("\n").trim();
      if (headerContent.length > 10) {
        chunks.push({
          ...input,
          chunkType: "header",
          symbolName: null,
          content: headerContent,
          startLine: 1,
          endLine: Math.min(firstSymbolLine - 1, 50),
          tokenCount: countTokens(headerContent),
          hash: sha256(headerContent),
        });
      }
    }

    // Create chunks for each symbol
    for (const symbol of symbols) {
      const startIdx = Math.max(0, symbol.startLine - 1);
      const endIdx = Math.min(lines.length - 1, symbol.endLine - 1);
      const chunkLines = lines.slice(startIdx, endIdx + 1);
      const content = chunkLines.join("\n").trim();

      if (content.length < 5) continue; // Skip tiny chunks

      const tokenCount = countTokens(content);
      if (tokenCount > maxTokenCount && chunkLines.length > maxChunkLines) {
        // Split large chunks by inner braces
        const subChunks = splitLargeChunk(content, startIdx + 1, input, symbol.name);
        chunks.push(...subChunks);
      } else {
        chunks.push({
          ...input,
          chunkType: symbol.type,
          symbolName: symbol.name,
          content,
          startLine: symbol.startLine,
          endLine: symbol.endLine,
          tokenCount,
          hash: sha256(content),
        });
      }
    }

    return chunks;
  }

  // Fallback: brace-based chunking for files without parsed symbols
  return braceBasedChunking(lines, input);
}

/**
 * Split a large chunk into smaller sub-chunks.
 */
function splitLargeChunk(
  content: string,
  baseLine: number,
  input: Omit<ChunkInput, "content">,
  parentName: string | null,
): CodeChunk[] {
  const lines = content.split("\n");
  const chunks: CodeChunk[] = [];
  let currentChunk: string[] = [];
  let currentStart = baseLine;
  const chunkSize = 100;

  for (let i = 0; i < lines.length; i++) {
    currentChunk.push(lines[i]);
    if (currentChunk.length >= chunkSize) {
      const chunkContent = currentChunk.join("\n").trim();
      if (chunkContent.length > 5) {
        chunks.push({
          ...input,
          chunkType: "block",
          symbolName: parentName,
          content: chunkContent,
          startLine: currentStart,
          endLine: currentStart + currentChunk.length - 1,
          tokenCount: countTokens(chunkContent),
          hash: sha256(chunkContent),
        });
      }
      currentStart += currentChunk.length;
      currentChunk = [];
    }
  }

  // Remaining lines
  if (currentChunk.length > 0) {
    const chunkContent = currentChunk.join("\n").trim();
    if (chunkContent.length > 5) {
      chunks.push({
        ...input,
        chunkType: "block",
        symbolName: parentName,
        content: chunkContent,
        startLine: currentStart,
        endLine: currentStart + currentChunk.length - 1,
        tokenCount: countTokens(chunkContent),
        hash: sha256(chunkContent),
      });
    }
  }

  return chunks;
}

/**
 * Fallback: chunk by brace boundaries.
 */
function braceBasedChunking(lines: string[], input: Omit<ChunkInput, "content">): CodeChunk[] {
  const chunks: CodeChunk[] = [];
  let i = 0;

  // Header chunk (first 30 lines or up to first function/class)
  const headerEnd = Math.min(lines.length, 30);
  let firstDecl = headerEnd;
  for (let j = 0; j < headerEnd; j++) {
    if (isFunctionStart(lines[j], input.language) || isClassStart(lines[j], input.language)) {
      firstDecl = j;
      break;
    }
  }

  if (firstDecl > 0) {
    const headerContent = lines.slice(0, firstDecl).join("\n").trim();
    if (headerContent.length > 10) {
      chunks.push({
        ...input,
        chunkType: "header",
        symbolName: null,
        content: headerContent,
        startLine: 1,
        endLine: firstDecl,
        tokenCount: countTokens(headerContent),
        hash: sha256(headerContent),
      });
    }
    i = firstDecl;
  }

  // Process declarations
  while (i < lines.length) {
    if (isClassStart(lines[i], input.language)) {
      const closeLine = findClosingBrace(lines, i);
      const endLine = closeLine !== null ? closeLine : Math.min(i + 200, lines.length - 1);
      const chunkContent = lines.slice(i, endLine + 1).join("\n").trim();

      if (chunkContent.length > 5) {
        const nameMatch = lines[i].match(/(?:class|interface)\s+(\w+)/);
        chunks.push({
          ...input,
          chunkType: "class",
          symbolName: nameMatch?.[1] ?? null,
          content: chunkContent,
          startLine: i + 1,
          endLine: endLine + 1,
          tokenCount: countTokens(chunkContent),
          hash: sha256(chunkContent),
        });
      }
      i = endLine + 1;
    } else if (isFunctionStart(lines[i], input.language)) {
      const closeLine = findClosingBrace(lines, i);
      const endLine = closeLine !== null ? closeLine : Math.min(i + 100, lines.length - 1);
      const chunkContent = lines.slice(i, endLine + 1).join("\n").trim();

      if (chunkContent.length > 5) {
        const nameMatch = lines[i].match(/(?:function|const|let|var)\s+(\w+)/);
        chunks.push({
          ...input,
          chunkType: "function",
          symbolName: nameMatch?.[1] ?? null,
          content: chunkContent,
          startLine: i + 1,
          endLine: endLine + 1,
          tokenCount: countTokens(chunkContent),
          hash: sha256(chunkContent),
        });
      }
      i = endLine + 1;
    } else {
      i++;
    }
  }

  return chunks;
}

/**
 * Build a text representation of a chunk for embedding.
 * Includes context: file path, language, symbol name, and content.
 */
export function chunkToEmbeddingText(chunk: CodeChunk): string {
  const parts: string[] = [];

  // File path gives context
  parts.push(`File: ${chunk.path}`);

  if (chunk.language) {
    parts.push(`Language: ${chunk.language}`);
  }

  if (chunk.symbolName) {
    parts.push(`Symbol: ${chunk.symbolName} (${chunk.chunkType})`);
  } else {
    parts.push(`Section: ${chunk.chunkType}`);
  }

  // Add a preview of the content
  const preview = chunk.content.slice(0, 1500);
  parts.push(preview);

  return parts.join("\n");
}

/**
 * Build a search-friendly text for full-text search.
 */
export function chunkToSearchText(chunk: CodeChunk): string {
  const parts: string[] = [];
  parts.push(chunk.path);
  if (chunk.symbolName) parts.push(chunk.symbolName);
  parts.push(chunk.content);
  return parts.join(" ");
}
