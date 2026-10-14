/**
 * GitHub API client (Phase 3).
 *
 * All calls use the authenticated user's OAuth access token stored by Auth.js
 * in the `Account` table. The user id is ALWAYS derived from the server-side
 * session by the route handlers — never from the client.
 */

import { prisma } from "@/services/db";

export class GitHubApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code = "GITHUB_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export interface GitHubTokenInfo {
  token: string;
  hasRepoScope: boolean;
}

/** Load the user's GitHub OAuth token (and whether it carries the `repo` scope). */
export async function getGitHubTokenForUser(userId: string): Promise<GitHubTokenInfo | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "github" },
    select: { access_token: true, scope: true },
  });

  // Diagnostic logging — safe (never logs the token value)
  console.log(
    `[GitHub Token] userId=${userId} accountFound=${!!account} hasToken=${!!account?.access_token} scope="${account?.scope ?? ""}"`,
  );

  if (!account?.access_token) return null;

  const scope = account.scope ?? "";
  // GitHub OAuth scope strings can be comma-separated OR space-separated
  // depending on the provider. Handle both.
  const scopes = scope.split(/[\s,]+/).filter(Boolean);
  const hasRepoScope = scopes.includes("repo");

  console.log(
    `[GitHub Token] parsedScopes=[${scopes.join(",")}] hasRepoScope=${hasRepoScope}`,
  );

  return { token: account.access_token, hasRepoScope };
}

async function githubFetch<T>(token: string, apiPath: string): Promise<T> {
  const res = await fetch(`https://api.github.com${apiPath}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "CodeAtlas",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new GitHubApiError(
        "Your GitHub token is no longer valid. Please sign in again.",
        401,
        "GITHUB_TOKEN_INVALID",
      );
    }
    if (res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0") {
      throw new GitHubApiError(
        "GitHub API rate limit reached. Please try again in a few minutes.",
        429,
        "GITHUB_RATE_LIMITED",
      );
    }
    if (res.status === 404) {
      throw new GitHubApiError(
        "Repository not found or you don't have access to it.",
        404,
        "GITHUB_NOT_FOUND",
      );
    }
    const body = await res.text().catch(() => "");
    throw new GitHubApiError(
      `GitHub API error (${res.status})${body ? `: ${body.slice(0, 200)}` : ""}`,
      res.status,
    );
  }

  return (await res.json()) as T;
}

export interface GitHubRepoSummary {
  id: number;
  fullName: string;
  name: string;
  description: string | null;
  defaultBranch: string | null;
  language: string | null;
  isPrivate: boolean;
  sizeKb: number;
}

interface GitHubRepoRaw {
  id: number;
  full_name: string;
  name: string;
  description: string | null;
  default_branch: string | null;
  language: string | null;
  private: boolean;
  size: number;
}

function mapRepo(raw: GitHubRepoRaw): GitHubRepoSummary {
  return {
    id: raw.id,
    fullName: raw.full_name,
    name: raw.name,
    description: raw.description,
    defaultBranch: raw.default_branch,
    language: raw.language,
    isPrivate: raw.private,
    sizeKb: raw.size,
  };
}

/** Repositories visible to the authenticated user (owner + collaborator). */
export async function listGitHubRepositories(token: string): Promise<GitHubRepoSummary[]> {
  const repos = await githubFetch<GitHubRepoRaw[]>(
    token,
    "/user/repos?per_page=100&affiliation=owner,collaborator&sort=updated",
  );
  return repos.map(mapRepo);
}

/** Fetch metadata for a single repository (`owner/name`). */
export async function fetchRepositoryMeta(
  token: string,
  fullName: string,
): Promise<GitHubRepoSummary> {
  const raw = await githubFetch<GitHubRepoRaw>(token, `/repos/${fullName}`);
  return mapRepo(raw);
}

export interface GitTreeEntry {
  path: string;
  sha: string;
  size: number;
  type: "blob" | "tree" | "commit";
}

/** Recursive file tree for a repository branch. */
export async function fetchRepositoryTree(
  token: string,
  fullName: string,
  branch: string,
): Promise<GitTreeEntry[]> {
  const data = await githubFetch<{
    tree: Array<{ path: string; sha: string; size?: number; type: string }>;
    truncated: boolean;
  }>(token, `/repos/${fullName}/git/trees/${encodeURIComponent(branch)}?recursive=1`);

  return data.tree
    .filter((entry) => entry.type === "blob")
    .map((entry) => ({
      path: entry.path,
      sha: entry.sha,
      size: entry.size ?? 0,
      type: "blob" as const,
    }));
}

export interface BlobContent {
  content: string; // base64-encoded
}

/** Fetch a single blob's base64 content. */
export async function fetchBlobContent(
  token: string,
  fullName: string,
  sha: string,
): Promise<BlobContent> {
  return githubFetch<BlobContent>(token, `/repos/${fullName}/git/blobs/${sha}`);
}
