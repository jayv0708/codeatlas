"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderGit2, RefreshCw, Trash2 } from "lucide-react";

import { ConnectRepositoryDialog } from "@/components/repositories/connect-repository-dialog";
import { RepositoryStatusBadge } from "@/components/repositories/repository-status-badge";
import type { RepositorySummary } from "@/types";

const ACTIVE_STATUSES = new Set(["QUEUED", "INDEXING"]);

export function RepositoriesView({
  initialRepositories,
}: {
  initialRepositories: RepositorySummary[];
}) {
  const [repositories, setRepositories] = useState(initialRepositories);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [confirmDisconnectId, setConfirmDisconnectId] = useState<string | null>(null);
  const [reindexingId, setReindexingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isActive = repositories.some((repo) => ACTIVE_STATUSES.has(repo.status));

  useEffect(() => {
    if (!isActive) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch("/api/repositories");
        if (res.ok) {
          const body = await res.json();
          setRepositories(body.repositories ?? []);
        }
      } catch {
        // keep last known state
      }
    }, 2500);
    return () => clearInterval(timer);
  }, [isActive]);

  const reindex = async (id: string) => {
    setReindexingId(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/repositories/${id}/reindex`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setActionError(body?.error?.message ?? "Could not start re-indexing.");
      } else {
        const refreshed = await fetch("/api/repositories");
        if (refreshed.ok) setRepositories((await refreshed.json()).repositories ?? []);
      }
    } catch {
      setActionError("Could not start re-indexing.");
    } finally {
      setReindexingId(null);
    }
  };

  const disconnect = async (id: string) => {
    setDisconnectingId(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/repositories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setActionError(body?.error?.message ?? "Could not disconnect this repository.");
        setConfirmDisconnectId(null);
      } else {
        setRepositories((current) => current.filter((repo) => repo.id !== id));
        setConfirmDisconnectId(null);
      }
    } catch {
      setActionError("Could not disconnect this repository.");
    } finally {
      setDisconnectingId(null);
    }
  };

  if (repositories.length === 0) {
    return (
      <div className="space-y-6">
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div
            className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: 'rgba(170,48,0,0.1)' }}
          >
            <FolderGit2 className="h-8 w-8" style={{ color: '#ffb59e' }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: '#f4f2eb' }}>No repositories connected yet.</h3>
          <p className="text-sm max-w-md mx-auto mb-6" style={{ color: '#8b949e' }}>
            Connect a GitHub repository and CodeAtlas will index it in the background — parsing code, extracting classes and functions, and mapping file-to-file dependencies.
          </p>
          <ConnectRepositoryDialog onConnected={() => void refreshList(setRepositories)} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: '#a3a19c' }}>
          {repositories.length} connected{" "}
          {repositories.length === 1 ? "repository" : "repositories"}
        </p>
        <ConnectRepositoryDialog onConnected={() => void refreshList(setRepositories)} />
      </div>

      {actionError ? (
        <div
          className="rounded-lg px-3 py-2 text-sm"
          style={{ background: 'rgba(224,109,123,0.08)', color: '#e06d7b', border: '1px solid rgba(224,109,123,0.15)' }}
          role="alert"
        >
          {actionError}
        </div>
      ) : null}

      {repositories.map((repo) => {
        const active = ACTIVE_STATUSES.has(repo.status);
        return (
          <div
            key={repo.id}
            className="rounded-xl border p-5 transition-all hover:border-opacity-30"
            style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <Link
                    href={`/repositories/${repo.id}`}
                    className="truncate text-base font-semibold hover:opacity-80 transition-opacity"
                    style={{ color: '#f4f2eb' }}
                  >
                    {repo.name}
                  </Link>
                  <RepositoryStatusBadge status={repo.status} />
                </div>
                <p className="mt-0.5 truncate text-sm" style={{ color: '#a3a19c' }}>
                  {repo.fullName}
                  {repo.language ? ` · ${repo.language}` : ""}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/repositories/${repo.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{ background: 'rgba(255,181,158,0.1)', color: '#ffb59e', border: '1px solid rgba(255,181,158,0.15)' }}
                >
                  View
                </Link>
                <button
                  type="button"
                  disabled={reindexingId === repo.id || active}
                  onClick={() => void reindex(repo.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#a3a19c', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${reindexingId === repo.id ? "animate-spin" : ""}`} aria-hidden="true" />
                  Re-index
                </button>
                {confirmDisconnectId === repo.id ? (
                  <button
                    type="button"
                    disabled={disconnectingId === repo.id}
                    onClick={() => void disconnect(repo.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                    style={{ background: 'rgba(224,109,123,0.12)', color: '#e06d7b', border: '1px solid rgba(224,109,123,0.2)' }}
                  >
                    {disconnectingId === repo.id ? "Removing…" : "Confirm"}
                  </button>
                ) : (
                  <button
                    type="button"
                    aria-label={`Disconnect ${repo.name}`}
                    onClick={() => { setConfirmDisconnectId(repo.id); setActionError(null); }}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs transition-colors"
                    style={{ color: '#a3a19c' }}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            {repo.description ? (
              <p className="mt-2 line-clamp-2 text-sm" style={{ color: '#a3a19c' }}>{repo.description}</p>
            ) : null}

            {active ? (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs" style={{ color: '#a3a19c' }}>
                  <span>
                    {repo.status === "QUEUED"
                      ? "Waiting to start…"
                      : repo.job?.stage === "FETCHING"
                        ? `Fetching files… (${repo.job?.filesProcessed ?? 0}/${repo.job?.totalFiles ?? "?"})`
                        : repo.job?.stage === "PARSING"
                          ? "Extracting symbols and dependencies…"
                          : "Indexing…"}
                  </span>
                  <span>{repo.progress}%</span>
                </div>
                <div
                  className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                  role="progressbar"
                  aria-valuenow={repo.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${repo.progress}%`, background: '#ffb59e' }}
                  />
                </div>
              </div>
            ) : null}

            {repo.status === "FAILED" && repo.lastError ? (
              <p
                className="mt-3 rounded-lg px-3 py-2 text-xs"
                style={{ background: 'rgba(224,109,123,0.08)', color: '#e06d7b' }}
              >
                {repo.lastError}
              </p>
            ) : null}

            <div className="mt-4 flex gap-5 text-xs" style={{ color: '#a3a19c' }}>
              <span>
                <strong className="font-semibold" style={{ color: '#f4f2eb' }}>{repo.counts.files}</strong> files
              </span>
              <span>
                <strong className="font-semibold" style={{ color: '#f4f2eb' }}>{repo.counts.symbols}</strong> symbols
              </span>
              <span>
                <strong className="font-semibold" style={{ color: '#f4f2eb' }}>{repo.counts.dependencies}</strong> dependencies
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

async function refreshList(setRepositories: (repos: RepositorySummary[]) => void): Promise<void> {
  try {
    const res = await fetch("/api/repositories");
    if (res.ok) setRepositories((await res.json()).repositories ?? []);
  } catch {
    // silent
  }
}
