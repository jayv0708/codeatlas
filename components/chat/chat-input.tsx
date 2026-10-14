"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  isLoading: boolean;
  isStreaming: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  onStop,
  isLoading,
  isStreaming,
  disabled = false,
  placeholder = "Ask a question...",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
  }, [value]);

  // Focus on mount
  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus();
    }
  }, [disabled]);

  const handleSubmit = useCallback(() => {
    if (!value.trim() || isLoading || disabled) return;
    onSend(value);
    setValue("");
  }, [value, isLoading, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <div
      className={cn(
        "relative rounded-xl border bg-white/5 transition-colors",
        disabled
          ? "border-white/5 opacity-50"
          : "border-white/10 focus-within:border-primary/30",
      )}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isLoading}
        rows={1}
        className="w-full resize-none bg-transparent px-4 py-3 pr-24 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none"
      />

      <div className="absolute bottom-2 right-2 flex items-center gap-2">
        {isStreaming ? (
          <button
            onClick={onStop}
            className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!value.trim() || isLoading || disabled}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              value.trim() && !isLoading && !disabled
                ? "bg-primary text-background hover:bg-primary/90"
                : "bg-white/5 text-on-surface-variant",
            )}
          >
            {isLoading ? (
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sending
              </span>
            ) : (
              <span className="flex items-center gap-1">
                Send
                <kbd className="ml-1 rounded bg-white/10 px-1 py-0.5 text-[10px]">⏎</kbd>
              </span>
            )}
          </button>
        )}
      </div>

      {disabled && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/50">
          <p className="text-xs text-on-surface-variant">
            Repository must be indexed before chatting
          </p>
        </div>
      )}
    </div>
  );
}
