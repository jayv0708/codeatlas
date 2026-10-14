"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Link2, Loader2, Lock, RefreshCw, Search, AlertCircle, CheckCircle2 } from "lucide-react";

import { GithubIcon } from "@/components/ui/github-icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { GitHubRepoOption } from "@/types";

interface ConnectRepositoryDialogProps {
  onConnected?: () => void;
}

type LoadState =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "ready"; repositories: GitHubRepoOption[] }
  | { state: "error"; message: string; code: string }
  | { state: "github-not-linked" }
  | { state: "github-needs-reauth" };

export function ConnectRepositoryDialog({ onConnected }: ConnectRepositoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [load, setLoad] = useState<LoadState>({ state: "idle" });
  const [query, setQuery] = useState("");
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectSuccess, setConnectSuccess] = useState<string | null>(null);
  const router = useRouter();

  const wasOpen = useRef(false);

  // Auto-open dialog after GitHub OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connect") === "github") {
      setOpen(true);
      // Clean up the URL param without reload
      const url = new URL(window.location.href);
      url.searchParams.delete("connect");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  // Reset state when dialog opens to pick up post-OAuth state
  useEffect(() => {
    if (open && !wasOpen.current) {
      setLoad({ state: "idle" });
      setQuery("");
      setConnectError(null);
      setConnectSuccess(null);
    }
    wasOpen.current = open;
  }, [open]);

  const loadRepositories = useCallback(async () => {
    setLoad({ state: "loading" });
    try {
      const res = await fetch("/api/github/repositories");
      const body = await res.json().catch(() => null);

      if (!res.ok) {
        const code = body?.error?.code ?? "UNKNOWN";
        const message = body?.error?.message ?? "Could not load your GitHub repositories.";

        if (code === "GITHUB_NOT_LINKED") {
          setLoad({ state: "github-not-linked" });
        } else if (code === "GITHUB_NEEDS_REAUTH") {
          // Loop protection: if we already attempted re-auth this session
          // and the API still says scopes are missing, show an error instead
          // of offering re-auth again (which would loop forever).
          const alreadyAttempted = sessionStorage.getItem("codeatlas:github-reauth-attempted");
          if (alreadyAttempted) {
            sessionStorage.removeItem("codeatlas:github-reauth-attempted");
            setLoad({
              state: "error",
              message:
                "GitHub re-authorization completed but repository access is still not available. " +
                "This can happen if the repo scope was not granted. Please try again and ensure you approve all requested permissions on GitHub.",
              code: "GITHUB_REAUTH_FAILED",
            });
          } else {
            setLoad({ state: "github-needs-reauth" });
          }
        } else {
          setLoad({ state: "error", message, code });
        }
        return;
      }

      // Successful load — clear any re-auth tracking
      sessionStorage.removeItem("codeatlas:github-reauth-attempted");
      setLoad({ state: "ready", repositories: body.repositories ?? [] });
    } catch {
      setLoad({ state: "error", message: "Could not reach the server. Please try again.", code: "NETWORK_ERROR" });
    }
  }, []);

  useEffect(() => {
    if (open && load.state === "idle") void loadRepositories();
  }, [open, load.state, loadRepositories]);

  const connect = async (fullName: string) => {
    setConnecting(fullName);
    setConnectError(null);
    setConnectSuccess(null);
    try {
      const res = await fetch("/api/repositories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName }),
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        const code = body?.error?.code ?? "UNKNOWN";
        const message = body?.error?.message ?? "Could not connect this repository.";

        if (code === "GITHUB_NEEDS_REAUTH" || code === "GITHUB_NOT_LINKED") {
          setConnectError("GitHub authorization is required. Please connect your GitHub account first.");
        } else if (code === "GITHUB_NOT_FOUND") {
          setConnectError("Repository not found. Make sure the repository exists and you have access.");
        } else if (code === "GITHUB_RATE_LIMITED") {
          setConnectError("GitHub rate limit reached. Please try again in a few minutes.");
        } else {
          setConnectError(message);
        }
        return;
      }

      // Success!
      setConnectSuccess(`Connected ${fullName} successfully! Indexing started in the background.`);
      setConnecting(null);

      // Refresh after short delay so user sees success message
      setTimeout(() => {
        setOpen(false);
        if (onConnected) {
          onConnected();
        } else {
          router.refresh();
        }
      }, 1200);
      return;
    } catch {
      setConnectError("Could not connect this repository. Please try again.");
    } finally {
      setConnecting(null);
    }
  };

  const filtered =
    load.state === "ready"
      ? load.repositories.filter((repo) =>
          repo.fullName.toLowerCase().includes(query.trim().toLowerCase()),
        )
      : [];

  const handleGitHubSignIn = () => {
    // Mark that we are attempting re-auth so the dialog can detect loops
    // (if re-auth succeeds but the token still lacks the needed scope).
    sessionStorage.setItem("codeatlas:github-reauth-attempted", "1");
    // prompt:consent is configured server-side in the GitHub provider config
    // (auth.config.ts) — passing it here in signIn() has no effect.
    void signIn("github", {
      callbackUrl: "/repositories?connect=github",
      prompt: "consent",
    } as any);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all hover:brightness-110"
          style={{ background: '#ffb59e', color: '#0f111a' }}
        >
          <Link2 className="h-4 w-4" aria-hidden="true" />
          Connect GitHub Repository
        </button>
      </DialogTrigger>
      <DialogContent
        className="max-w-2xl border-0"
        style={{ background: '#161820', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: '#f4f2eb' }}>Connect a repository</DialogTitle>
          <DialogDescription style={{ color: '#a3a19c' }}>
            Pick a GitHub repository to index. CodeAtlas fetches its source, extracts symbols, and
            maps file-to-file dependencies in the background.
          </DialogDescription>
        </DialogHeader>

        {/* GitHub Not Linked State */}
        {load.state === "github-not-linked" ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,181,158,0.1)', border: '1px solid rgba(255,181,158,0.15)' }}
            >
              <GithubIcon className="h-8 w-8" style={{ color: '#ffb59e' }} aria-hidden="true" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium mb-1" style={{ color: '#f4f2eb' }}>
                GitHub account not linked
              </p>
              <p className="text-xs max-w-sm" style={{ color: '#a3a19c' }}>
                To connect a repository, you need to sign in with GitHub first.
                This grants CodeAtlas read-only access to your repositories.
              </p>
            </div>
            <button
              type="button"
              onClick={handleGitHubSignIn}
              className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all hover:brightness-110"
              style={{ background: '#ffb59e', color: '#0f111a' }}
            >
              <GithubIcon className="h-4 w-4" aria-hidden="true" />
              Sign in with GitHub
            </button>
            <p className="text-xs" style={{ color: 'rgba(163,161,156,0.6)' }}>
              You can link both Google and GitHub to the same account.
            </p>
          </div>
        ) : null}

        {/* GitHub Needs Reauth State */}
        {load.state === "github-needs-reauth" ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,181,158,0.1)', border: '1px solid rgba(255,181,158,0.15)' }}
            >
              <AlertCircle className="h-8 w-8" style={{ color: '#ffb59e' }} aria-hidden="true" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium mb-1" style={{ color: '#f4f2eb' }}>
                Repository access required
              </p>
              <p className="text-xs max-w-sm" style={{ color: '#a3a19c' }}>
                Your GitHub account needs repository read permission.
                Please re-authorize to grant access to your repositories.
              </p>
            </div>
            <button
              type="button"
              onClick={handleGitHubSignIn}
              className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all hover:brightness-110"
              style={{ background: '#ffb59e', color: '#0f111a' }}
            >
              <GithubIcon className="h-4 w-4" aria-hidden="true" />
              Re-authorize GitHub
            </button>
          </div>
        ) : null}

        {/* Generic Error State */}
        {load.state === "error" ? (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(224,109,123,0.1)', border: '1px solid rgba(224,109,123,0.15)' }}
            >
              <AlertCircle className="h-6 w-6" style={{ color: '#e06d7b' }} aria-hidden="true" />
            </div>
            <p className="text-sm" style={{ color: '#a3a19c' }}>{load.message}</p>
            <button
              type="button"
              onClick={() => void loadRepositories()}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all hover:brightness-110"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#f4f2eb', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try again
            </button>
          </div>
        ) : null}

        {/* Loading State */}
        {load.state === "loading" ? (
          <div className="space-y-2 p-1" aria-label="Loading repositories">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-14 w-full animate-pulse rounded-lg"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              />
            ))}
          </div>
        ) : null}

        {/* Repository List (ready state) */}
        {load.state === "ready" ? (
          <>
            {/* Search */}
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: '#a3a19c' }}
                aria-hidden="true"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search your repositories..."
                aria-label="Search repositories"
                className="w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-1"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)', color: '#f4f2eb', '--tw-ring-color': '#ffb59e' } as React.CSSProperties}
              />
            </div>

            {/* Repository List */}
            <div
              className="max-h-80 min-h-40 overflow-y-auto rounded-lg border"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              {filtered.length === 0 ? (
                <p className="p-6 text-center text-sm" style={{ color: '#a3a19c' }}>
                  {query
                    ? "No repositories match your search."
                    : "No repositories found. Make sure your GitHub account has repositories."}
                </p>
              ) : (
                filtered.map((repo) => (
                  <div
                    key={repo.id}
                    className="flex items-center gap-3 border-b px-3 py-2.5 last:border-b-0 transition-colors hover:bg-white/[0.02]"
                    style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium" style={{ color: '#f4f2eb' }}>{repo.fullName}</p>
                        {repo.isPrivate ? (
                          <span
                            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium"
                            style={{ background: 'rgba(255,255,255,0.06)', color: '#a3a19c' }}
                          >
                            <Lock className="h-2.5 w-2.5" aria-hidden="true" />
                            Private
                          </span>
                        ) : null}
                      </div>
                      {repo.description ? (
                        <p className="truncate text-xs" style={{ color: '#a3a19c' }}>{repo.description}</p>
                      ) : null}
                    </div>
                    <span className="text-xs flex-shrink-0" style={{ color: '#a3a19c' }}>{repo.language ?? "—"}</span>
                    <button
                      type="button"
                      disabled={repo.connected || connecting === repo.fullName}
                      onClick={() => void connect(repo.fullName)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-40 flex-shrink-0"
                      style={
                        repo.connected
                          ? { background: 'rgba(109,213,160,0.08)', color: '#6dd5a0', border: '1px solid rgba(109,213,160,0.15)' }
                          : connecting === repo.fullName
                            ? { background: 'rgba(255,181,158,0.15)', color: '#ffb59e', border: '1px solid rgba(255,181,158,0.2)' }
                            : { background: '#ffb59e', color: '#0f111a' }
                      }
                    >
                      {connecting === repo.fullName ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      ) : repo.connected ? (
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : null}
                      {connecting === repo.fullName ? "Connecting..." : repo.connected ? "Connected" : "Connect"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        ) : null}

        {/* Connect Error */}
        {connectError ? (
          <div
            className="rounded-lg px-3 py-2.5 flex items-start gap-2"
            style={{ background: 'rgba(224,109,123,0.08)', border: '1px solid rgba(224,109,123,0.15)' }}
            role="alert"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#e06d7b' }} />
            <p className="text-xs" style={{ color: '#e06d7b' }}>{connectError}</p>
          </div>
        ) : null}

        {/* Connect Success */}
        {connectSuccess ? (
          <div
            className="rounded-lg px-3 py-2.5 flex items-start gap-2"
            style={{ background: 'rgba(109,213,160,0.08)', border: '1px solid rgba(109,213,160,0.15)' }}
            role="status"
          >
            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#6dd5a0' }} />
            <p className="text-xs" style={{ color: '#6dd5a0' }}>{connectSuccess}</p>
          </div>
        ) : null}

        <p className="text-xs" style={{ color: '#a3a19c' }}>
          Indexing runs in the background — you can leave this page while it completes.
        </p>
      </DialogContent>
    </Dialog>
  );
}
