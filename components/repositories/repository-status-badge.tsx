import type { RepositoryStatus } from "@/types";

const STYLES: Record<RepositoryStatus, { bg: string; color: string; border: string }> = {
  NOT_CONNECTED: { bg: 'rgba(255,255,255,0.05)', color: '#a3a19c', border: 'rgba(255,255,255,0.08)' },
  QUEUED: { bg: 'rgba(123,158,255,0.1)', color: '#7b9eff', border: 'rgba(123,158,255,0.15)' },
  INDEXING: { bg: 'rgba(255,181,158,0.1)', color: '#ffb59e', border: 'rgba(255,181,158,0.15)' },
  INDEXED: { bg: 'rgba(109,213,160,0.1)', color: '#6dd5a0', border: 'rgba(109,213,160,0.15)' },
  FAILED: { bg: 'rgba(224,109,123,0.1)', color: '#e06d7b', border: 'rgba(224,109,123,0.15)' },
};

const LABELS: Record<RepositoryStatus, string> = {
  NOT_CONNECTED: "Not connected",
  QUEUED: "Queued",
  INDEXING: "Indexing",
  INDEXED: "Indexed",
  FAILED: "Failed",
};

export function RepositoryStatusBadge({
  status,
  className,
}: {
  status: RepositoryStatus;
  className?: string;
}) {
  const style = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${className ?? ""}`}
      style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}
    >
      {status === "INDEXING" || status === "QUEUED" ? (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: style.color }} aria-hidden="true" />
      ) : null}
      {LABELS[status]}
    </span>
  );
}
