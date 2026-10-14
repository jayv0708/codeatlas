"use client";

import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string | null;
  messageCount: number;
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ConversationSidebar({
  conversations,
  activeConversationId,
  onSelect,
  onNew,
  isOpen,
  onClose,
}: ConversationSidebarProps) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-white/10 bg-surface transition-transform lg:relative lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h2 className="text-sm font-medium text-on-surface">Conversations</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={onNew}
                className="rounded p-1.5 text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
                aria-label="New conversation"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="rounded p-1.5 text-on-surface-variant hover:bg-white/5 hover:text-on-surface lg:hidden"
                aria-label="Close sidebar"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-xs text-on-surface-variant">
                  No conversations yet.
                  <br />
                  Start by asking a question.
                </p>
              </div>
            ) : (
              <div className="p-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => {
                      onSelect(conv.id);
                      onClose();
                    }}
                    className={cn(
                      "w-full rounded-lg px-3 py-2 text-left transition-colors",
                      activeConversationId === conv.id
                        ? "bg-white/10 text-on-surface"
                        : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface",
                    )}
                  >
                    <p className="truncate text-sm">{conv.title ?? "Untitled"}</p>
                    <p className="mt-0.5 text-xs text-on-surface-variant/60">
                      {conv.messageCount} messages
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
