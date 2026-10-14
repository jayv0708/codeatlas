/**
 * GET /api/repositories/[id]/git
 *
 * Git intelligence endpoint — fetches commit history, file changes,
 * and PR information from GitHub for the connected repository.
 *
 * Query params:
 *   ?path=src/auth/service.ts  — commits touching a specific file
 *   ?sha=abc123                — details for a specific commit
 *   ?page=1                    — pagination
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { prisma } from "@/services/db";
import { getGitHubTokenForUser, GitHubApiError } from "@/lib/github";

interface GitCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

interface GitFileChange {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
}

interface GitCommitDetail {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
  files: GitFileChange[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: repositoryId } = await params;
    const repo = await prisma.repository.findFirst({
      where: { id: repositoryId, userId: session.user.id as string },
      select: { id: true, fullName: true, defaultBranch: true, status: true },
    });

    if (!repo) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    if (repo.status !== "INDEXED" || !repo.fullName) {
      return NextResponse.json(
        { error: "Repository is not indexed or has no GitHub connection." },
        { status: 400 },
      );
    }

    const tokenInfo = await getGitHubTokenForUser(session.user.id as string);
    if (!tokenInfo) {
      return NextResponse.json(
        { error: "GitHub token not available. Please sign in again." },
        { status: 401 },
      );
    }

    const { searchParams } = request.nextUrl;
    const filePath = searchParams.get("path");
    const commitSha = searchParams.get("sha");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const branch = repo.defaultBranch ?? "main";

    const headers = {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${tokenInfo.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "CodeAtlas",
    };

    // Fetch specific commit details
    if (commitSha) {
      const commitRes = await fetch(
        `https://api.github.com/repos/${repo.fullName}/commits/${commitSha}`,
        { headers, cache: "no-store" },
      );

      if (!commitRes.ok) {
        throw new GitHubApiError("Failed to fetch commit", commitRes.status);
      }

      const commit = await commitRes.json() as Record<string, unknown>;
      const commitData = commit as {
        sha: string;
        commit: { message: string; author: { name: string; date: string } };
        html_url: string;
        files?: Array<{
          filename: string;
          status: string;
          additions: number;
          deletions: number;
          changes: number;
        }>;
      };

      const detail: GitCommitDetail = {
        sha: commitData.sha,
        message: commitData.commit.message,
        author: commitData.commit.author.name,
        date: commitData.commit.author.date,
        url: commitData.html_url,
        files: (commitData.files ?? []).map((f) => ({
          filename: f.filename,
          status: f.status,
          additions: f.additions,
          deletions: f.deletions,
          changes: f.changes,
        })),
      };

      return NextResponse.json({ commit: detail });
    }

    // Fetch commit history (optionally filtered by file path)
    let commitsUrl = `https://api.github.com/repos/${repo.fullName}/commits?sha=${branch}&per_page=15&page=${page}`;
    if (filePath) {
      commitsUrl += `&path=${encodeURIComponent(filePath)}`;
    }

    const commitsRes = await fetch(commitsUrl, { headers, cache: "no-store" });

    if (!commitsRes.ok) {
      throw new GitHubApiError("Failed to fetch commits", commitsRes.status);
    }

    const commitsRaw = await commitsRes.json() as Array<{
      sha: string;
      commit: { message: string; author: { name: string; date: string } };
      html_url: string;
    }>;

    const commits: GitCommit[] = commitsRaw.map((c) => ({
      sha: c.sha,
      message: c.commit.message.split("\n")[0], // first line only
      author: c.commit.author.name,
      date: c.commit.author.date,
      url: c.html_url,
    }));

    return NextResponse.json({
      commits,
      page,
      hasMore: commitsRaw.length === 15,
      filePath: filePath ?? null,
      branch,
    });
  } catch (error) {
    console.error("[git] Error:", error instanceof Error ? error.message : "unknown");
    const message =
      error instanceof GitHubApiError ? error.message : "Internal server error";
    const status = error instanceof GitHubApiError ? error.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
