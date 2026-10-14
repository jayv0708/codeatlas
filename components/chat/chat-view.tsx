"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Send,
  Bot,
  User,
  Copy,
  Check,
  AlertCircle,
  MessageSquare,
  FileCode,
  Loader2,
  ChevronDown,
  Trash2,
  RotateCcw,
} from "lucide-react";

import type { RepositorySummary } from "@/types";

interface ChatViewProps {
  repositories: RepositorySummary[];
  user: { name?: string | null; image?: string | null };
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  evidence?: Array<{ file: string; lines: string; reason: string }>;
  timestamp: Date;
}

export function ChatView({ repositories, user }: ChatViewProps) {
  const [selectedRepo, setSelectedRepo] = useState<RepositorySummary | null>(
    repositories[0] ?? null,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showRepoSelector, setShowRepoSelector] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || !selectedRepo) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    const assistantId = `assistant-${Date.now()}`;
    let fullContent = "";

    try {
      const res = await fetch(`/api/repositories/${selectedRepo.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          conversationId,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to get response");
      }

      // Parse SSE stream
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let evidence: Message["evidence"] = undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("event: chunk")) {
            // Next data line is the chunk
            continue;
          }
          if (line.startsWith("event: done")) {
            // Parse the done event data from the next line
            continue;
          }
          if (line.startsWith("event: error")) {
            continue;
          }
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);

              // Check if this is a done event
              if (typeof parsed === "string") {
                try {
                  const doneData = JSON.parse(parsed);
                  if (doneData.conversationId) {
                    setConversationId(doneData.conversationId);
                  }
                  if (doneData.evidence) {
                    evidence = doneData.evidence;
                  }
                } catch {
                  // Not JSON, must be a text chunk
                  fullContent += parsed;
                  setMessages((prev) => {
                    const updated = [...prev];
                    const lastMsg = updated[updated.length - 1];
                    if (lastMsg?.id === assistantId) {
                      lastMsg.content = fullContent;
                    } else {
                      updated.push({
                        id: assistantId,
                        role: "assistant",
                        content: fullContent,
                        timestamp: new Date(),
                      });
                    }
                    return updated;
                  });
                }
              } else {
                // It's a chunk of text
                fullContent += parsed;
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastMsg = updated[updated.length - 1];
                  if (lastMsg?.id === assistantId) {
                    lastMsg.content = fullContent;
                  } else {
                    updated.push({
                      id: assistantId,
                      role: "assistant",
                      content: fullContent,
                      timestamp: new Date(),
                    });
                  }
                  return updated;
                });
              }
            } catch {
              // Not JSON, treat as text chunk
              fullContent += data;
              setMessages((prev) => {
                const updated = [...prev];
                const lastMsg = updated[updated.length - 1];
                if (lastMsg?.id === assistantId) {
                  lastMsg.content = fullContent;
                } else {
                  updated.push({
                    id: assistantId,
                    role: "assistant",
                    content: fullContent,
                    timestamp: new Date(),
                  });
                }
                return updated;
              });
            }
          }
        }
      }

      // Add evidence to the final message if available
      if (evidence) {
        setMessages((prev) => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg?.id === assistantId) {
            lastMsg.evidence = evidence;
          }
          return updated;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      // Remove the assistant message placeholder if it was created
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, selectedRepo, conversationId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const copyMessage = useCallback(async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  }, []);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  }, []);

  if (repositories.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8">
        <div
          className="max-w-md text-center rounded-2xl p-8"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <MessageSquare size={48} style={{ color: "#8b949e" }} className="mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2" style={{ color: "#f4f2eb" }}>
            No indexed repositories
          </h2>
          <p className="text-sm mb-6" style={{ color: "#8b949e" }}>
            Connect a GitHub repository and wait for indexing to complete to start chatting with your codebase.
          </p>
          <Link
            href="/repositories"
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all hover:brightness-110"
            style={{ background: "#ffb59e", color: "#0f111a" }}
          >
            <FileCode size={16} />
            Connect Repository
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(12,14,18,0.8)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="relative min-w-0">
            <button
              onClick={() => setShowRepoSelector(!showRepoSelector)}
              className="flex items-center gap-2 rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors truncate max-w-[140px] sm:max-w-none"
              style={{ background: "rgba(255,255,255,0.05)", color: "#f4f2eb" }}
            >
              <FileCode size={14} style={{ color: "#ffb59e" }} className="flex-shrink-0" />
              <span className="truncate">{selectedRepo?.name ?? "Select repository"}</span>
              <ChevronDown size={14} style={{ color: "#8b949e" }} className="flex-shrink-0" />
            </button>

            {showRepoSelector && (
              <div
                className="absolute top-full left-0 mt-2 w-64 sm:w-72 rounded-xl border overflow-hidden z-50"
                style={{ background: "#161820", borderColor: "rgba(255,255,255,0.08)" }}
              >
                {repositories.map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => {
                      setSelectedRepo(repo);
                      setShowRepoSelector(false);
                      clearConversation();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <FileCode size={14} style={{ color: "#ffb59e" }} />
                    <div>
                      <div className="text-sm font-medium" style={{ color: "#f4f2eb" }}>
                        {repo.name}
                      </div>
                      <div className="text-xs" style={{ color: "#8b949e" }}>
                        {repo.fullName} · {repo.language ?? "Unknown"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedRepo && (
            <div className="hidden sm:flex items-center gap-2 text-xs" style={{ color: "#8b949e" }}>
              <span className="w-2 h-2 rounded-full" style={{ background: "#6dd5a0" }} />
              Indexed · {selectedRepo.counts.files} files
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={clearConversation}
              className="p-2 rounded-lg transition-colors"
              style={{ color: "#8b949e" }}
              title="Clear conversation"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot size={48} style={{ color: "#8b949e" }} className="mb-4" />
            <h3 className="text-lg font-medium mb-2" style={{ color: "#f4f2eb" }}>
              Ask about {selectedRepo?.name ?? "your codebase"}
            </h3>
            <p className="text-sm max-w-md" style={{ color: "#8b949e" }}>
              Ask questions about your code, architecture, dependencies, or git history. CodeAtlas will search your repository and provide evidence-backed answers.
            </p>
            <div className="flex flex-wrap gap-2 mt-4 sm:mt-6 justify-center px-2">
              {[
                "How does authentication work?",
                "Where is the database connection?",
                "What does UserService do?",
                "How does the API reach PostgreSQL?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="px-3 py-1.5 rounded-lg text-xs transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)", color: "#a3a19c", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(255,181,158,0.12)" }}
              >
                <Bot size={16} style={{ color: "#ffb59e" }} />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[70%] rounded-xl px-3 sm:px-4 py-3 ${msg.role === "user" ? "rounded-br-sm" : "rounded-bl-sm"}`}
              style={{
                background: msg.role === "user" ? "rgba(255,181,158,0.12)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${msg.role === "user" ? "rgba(255,181,158,0.15)" : "rgba(255,255,255,0.05)"}`,
              }}
            >
              <div className="text-sm whitespace-pre-wrap" style={{ color: "#f4f2eb" }}>
                {msg.content}
              </div>

              {msg.evidence && msg.evidence.length > 0 && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  <div className="text-xs font-medium mb-1" style={{ color: "#8b949e" }}>
                    Found evidence in:
                  </div>
                  <div className="space-y-1">
                    {msg.evidence.map((e, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <FileCode size={12} style={{ color: "#ffb59e" }} />
                        <span style={{ color: "#ffb59e" }}>{e.file}</span>
                        {e.lines && (
                          <span style={{ color: "#8b949e" }}>{e.lines}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {msg.role === "assistant" && (
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => copyMessage(msg.id, msg.content)}
                    className="p-1 rounded transition-colors"
                    style={{ color: "#8b949e" }}
                    title="Copy response"
                  >
                    {copiedMessageId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              )}
            </div>

            {msg.role === "user" && (
              <div
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(123,158,255,0.12)" }}
              >
                {user.image ? (
                  <img src={user.image} alt="" className="w-5 h-5 rounded-full" />
                ) : (
                  <User size={16} style={{ color: "#7b9eff" }} />
                )}
              </div>
            )}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-3">
            <div
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(255,181,158,0.12)" }}
            >
              <Loader2 size={16} style={{ color: "#ffb59e" }} className="animate-spin" />
            </div>
            <div
              className="rounded-xl px-4 py-3 rounded-bl-sm"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="flex items-center gap-2 text-sm" style={{ color: "#8b949e" }}>
                <Loader2 size={14} className="animate-spin" />
                Searching codebase...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 pb-2">
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
            style={{ background: "rgba(224,109,123,0.08)", color: "#e06d7b", border: "1px solid rgba(224,109,123,0.15)" }}
          >
            <AlertCircle size={14} />
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-auto p-1 hover:opacity-70"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 sm:p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div
          className="flex items-end gap-2 rounded-xl border p-2"
          style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedRepo ? `Ask about ${selectedRepo.name}...` : "Select a repository first..."}
            disabled={!selectedRepo || isLoading}
            rows={1}
            className="flex-1 bg-transparent border-none outline-none resize-none text-sm py-2 px-2 min-h-[36px] max-h-[120px]"
            style={{ color: "#f4f2eb" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || !selectedRepo}
            className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
            style={{ background: "#ffb59e", color: "#0f111a" }}
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 px-1 sm:px-2">
          <p className="text-[10px] sm:text-xs" style={{ color: "#8b949e" }}>
            Enter to send · Shift+Enter for newline
          </p>
          {selectedRepo && (
            <p className="text-[10px] sm:text-xs hidden sm:block" style={{ color: "#8b949e" }}>
              {selectedRepo.counts.symbols} symbols · {selectedRepo.counts.dependencies} deps
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
