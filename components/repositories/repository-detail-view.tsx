"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileCode2, GitFork, MessageSquare, RefreshCw, Trash2, Type } from "lucide-react";

import { RepositoryStatusBadge } from "@/components/repositories/repository-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RepositoryDetail } from "@/types";

const ACTIVE_STATUSES = new Set(["QUEUED", "INDEXING"]);

const SYMBOL_LABELS: Record<string, string> = {
  class: "Classes",
  function: "Functions",
  method: "Methods",
  interface: "Interfaces",
  type: "Type aliases",
  import: "Imports",
  export: "Exports",
};

export function RepositoryDetailView({ initialDetail }: { initialDetail: RepositoryDetail }) {
  const [detail, setDetail] = useState(initialDetail);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const router = useRouter();

  const active = ACTIVE_STATUSES.has(detail.status);

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/repositories/${detail.id}`);
        if (res.ok) {
          const body = await res.json();
          setDetail(body.repository);
        }
      } catch {
        // keep last known state
      }
    }, 2500);
    return () => clearInterval(timer);
  }, [active, detail.id]);

  const reindex = async () => {
    setBusy("reindex");
    setActionError(null);
    try {
      const res = await fetch(`/api/repositories/${detail.id}/reindex`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setActionError(body?.error?.message ?? "Could not start re-indexing.");
      } else {
        const refreshed = await fetch(`/api/repositories/${detail.id}`);
        if (refreshed.ok) setDetail((await refreshed.json()).repository);
      }
    } catch {
      setActionError("Could not start re-indexing.");
    } finally {
      setBusy(null);
    }
  };

  const disconnect = async () => {
    setBusy("disconnect");
    setActionError(null);
    try {
      const res = await fetch(`/api/repositories/${detail.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/repositories");
        return;
      }
      const body = await res.json().catch(() => null);
      setActionError(body?.error?.message ?? "Could not disconnect this repository.");
    } catch {
      setActionError("Could not disconnect this repository.");
    } finally {
      setBusy(null);
    }
  };

  const totalSymbols = detail.symbolTypes.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/repositories"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Repositories
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{detail.name}</h1>
            <RepositoryStatusBadge status={detail.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {detail.fullName}
            {detail.language ? ` · ${detail.language}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {detail.status === "INDEXED" && (
            <Button variant="outline" asChild>
              <Link href={`/repositories/${detail.id}/chat`}>
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                Chat with AI
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            disabled={busy === "reindex" || active}
            onClick={() => void reindex()}
          >
            <RefreshCw
              className={cn("h-4 w-4", busy === "reindex" && "animate-spin")}
              aria-hidden="true"
            />
            Re-index
          </Button>
          {confirmDisconnect ? (
            <Button
              variant="destructive"
              disabled={busy === "disconnect"}
              onClick={() => void disconnect()}
            >
              {busy === "disconnect" ? "Removing…" : "Confirm disconnect"}
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => {
                setConfirmDisconnect(true);
                setActionError(null);
              }}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Disconnect
            </Button>
          )}
        </div>
      </div>

      {actionError ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {actionError}
        </p>
      ) : null}

      {detail.status === "FAILED" && detail.lastError ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          Indexing failed: {detail.lastError} You can retry with Re-index.
        </p>
      ) : null}

      {active ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>
                {detail.status === "QUEUED"
                  ? "Waiting to start…"
                  : detail.job?.stage === "FETCHING"
                    ? `Fetching files… (${detail.job?.filesProcessed ?? 0}/${detail.job?.totalFiles ?? "?"})`
                    : detail.job?.stage === "PARSING"
                      ? "Extracting symbols and dependencies…"
                      : "Indexing…"}
              </span>
              <span>{detail.progress}%</span>
            </div>
            <div
              className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-valuenow={detail.progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{ width: `${detail.progress}%` }}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatBox icon={FileCode2} label="Files" value={detail.counts.files} />
        <StatBox icon={Type} label="Symbols" value={totalSymbols} />
        <StatBox icon={GitFork} label="Dependencies" value={detail.counts.dependencies} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Languages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {detail.languages.length === 0 ? (
              <p className="text-sm text-slate-500">No files indexed yet.</p>
            ) : (
              detail.languages.map(({ language, count }) => {
                const max = Math.max(...detail.languages.map((row) => row.count));
                return (
                  <div key={language ?? "unknown"}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{language ?? "Unknown"}</span>
                      <span className="text-slate-500">{count}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${Math.round((count / max) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Symbols</CardTitle>
          </CardHeader>
          <CardContent>
            {detail.symbolTypes.length === 0 ? (
              <p className="text-sm text-slate-500">No symbols extracted yet.</p>
            ) : (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                {detail.symbolTypes.map(({ type, count }) => (
                  <div key={type} className="flex items-center justify-between">
                    <dt className="text-sm text-slate-500">{SYMBOL_LABELS[type] ?? type}</dt>
                    <dd className="text-sm font-semibold text-slate-900">{count}</dd>
                  </div>
                ))}
              </dl>
            )}
          </CardContent>
        </Card>
      </div>

      {detail.topSymbols.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top symbols</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-slate-100">
              {detail.topSymbols.map((symbol) => (
                <li
                  key={`${symbol.path}:${symbol.name}`}
                  className="flex items-center gap-3 px-6 py-2.5 text-sm"
                >
                  <span
                    className={cn(
                      "w-20 shrink-0 rounded px-1.5 py-0.5 text-center text-[10px] font-semibold uppercase tracking-wide",
                      symbol.type === "class"
                        ? "bg-indigo-50 text-indigo-700"
                        : "bg-emerald-50 text-emerald-700",
                    )}
                  >
                    {symbol.type}
                  </span>
                  <code className="flex-1 truncate font-mono text-slate-800">{symbol.name}</code>
                  <span className="truncate text-xs text-slate-400">
                    {symbol.path}:{symbol.startLine}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileCode2;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
