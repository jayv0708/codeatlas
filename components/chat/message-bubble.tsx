"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  evidence?: Array<{ file: string; lines: string; reason: string }>;
  isStreaming?: boolean;
}

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may be unavailable
    }
  }, [message.content]);

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
          AI
        </div>
      )}

      <div
        className={cn(
          "max-w-[85%] rounded-xl px-4 py-3",
          isUser
            ? "bg-primary/10 text-on-surface"
            : "bg-white/5 text-on-surface",
        )}
      >
        {/* Content */}
        <div className="prose prose-invert prose-sm max-w-none">
          <MessageContent content={message.content} isStreaming={message.isStreaming} />
        </div>

        {/* Evidence citations */}
        {message.evidence && message.evidence.length > 0 && (
          <div className="mt-3 border-t border-white/10 pt-3">
            <p className="mb-2 text-xs font-medium text-on-surface-variant">
              Sources:
            </p>
            <div className="flex flex-wrap gap-2">
              {message.evidence.map((ev, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1 text-xs"
                >
                  <svg
                    className="h-3 w-3 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="text-on-surface">{ev.file}</span>
                  {ev.lines && (
                    <span className="text-on-surface-variant">{ev.lines}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {!isUser && !message.isStreaming && message.content && (
          <div className="mt-2 flex gap-2">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-on-surface-variant transition-colors hover:bg-white/5 hover:text-on-surface"
            >
              {copied ? (
                <>
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
        )}

        {/* Streaming indicator */}
        {message.isStreaming && !message.content && (
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
            </div>
            <span>Analyzing your codebase...</span>
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-xs text-on-surface-variant">
          U
        </div>
      )}
    </div>
  );
}

/**
 * Simple markdown renderer for AI responses.
 * Handles code blocks, inline code, bold, and links.
 */
function MessageContent({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming?: boolean;
}) {
  if (!content) return null;

  // Split by code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <>
      {parts.map((part, i) => {
        // Code block
        if (part.startsWith("```")) {
          const lines = part.slice(3, -3);
          const firstNewline = lines.indexOf("\n");
          const lang = firstNewline > 0 ? lines.slice(0, firstNewline).trim() : "";
          const code = firstNewline > 0 ? lines.slice(firstNewline + 1) : lines;

          return (
            <div key={i} className="my-2 overflow-x-auto rounded-lg bg-black/30">
              {lang && (
                <div className="border-b border-white/5 px-3 py-1 text-xs text-on-surface-variant">
                  {lang}
                </div>
              )}
              <pre className="p-3 text-sm">
                <code className="font-mono text-on-surface">{code}</code>
              </pre>
            </div>
          );
        }

        // Regular text with inline formatting
        return (
          <div key={i} className="whitespace-pre-wrap">
            {renderInlineMarkdown(part)}
          </div>
        );
      })}
      {isStreaming && content && (
        <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary" />
      )}
    </>
  );
}

/**
 * Render inline markdown: bold, inline code, and links.
 */
function renderInlineMarkdown(text: string): React.ReactNode[] {
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\[([^\]]+)\]\(([^)]+)\))/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const matched = match[0];
    if (matched.startsWith("`")) {
      // Inline code
      parts.push(
        <code
          key={match.index}
          className="rounded bg-white/10 px-1 py-0.5 text-sm text-primary"
        >
          {matched.slice(1, -1)}
        </code>,
      );
    } else if (matched.startsWith("**")) {
      // Bold
      parts.push(
        <strong key={match.index} className="font-semibold text-on-surface">
          {matched.slice(2, -2)}
        </strong>,
      );
    } else if (matched.startsWith("[")) {
      // Link
      parts.push(
        <a
          key={match.index}
          href={match[3]}
          className="text-primary underline underline-offset-2 hover:text-primary/80"
          target="_blank"
          rel="noopener noreferrer"
        >
          {match[2]}
        </a>,
      );
    }

    lastIndex = match.index + matched.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}
