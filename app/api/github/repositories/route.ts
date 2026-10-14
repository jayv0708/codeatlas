import { NextResponse } from "next/server";

import { ApiError, apiErrorResponse, requireApiUser } from "@/lib/api";
import { getGitHubTokenForUser, listGitHubRepositories } from "@/lib/github";
import { prisma } from "@/services/db";

export async function GET() {
  try {
    const user = await requireApiUser();
    console.log(`[GitHub Repos] User ${user.id} requesting repository list`);

    // Check if user has a GitHub account linked
    const githubAccount = await prisma.account.findFirst({
      where: { userId: user.id, provider: "github" },
      select: { access_token: true, scope: true },
    });

    console.log(
      `[GitHub Repos] Account found: ${!!githubAccount}, hasToken: ${!!githubAccount?.access_token}, scope: ${githubAccount?.scope ?? "none"}`,
    );

    if (!githubAccount?.access_token) {
      throw new ApiError(
        401,
        "GITHUB_NOT_LINKED",
        "No GitHub account linked. Please sign in with GitHub to access your repositories.",
      );
    }

    const tokenInfo = await getGitHubTokenForUser(user.id);
    console.log(
      `[GitHub Repos] tokenInfo: ${tokenInfo ? `hasRepoScope=${tokenInfo.hasRepoScope}` : "null"}`,
    );

    if (!tokenInfo) {
      throw new ApiError(
        401,
        "GITHUB_TOKEN_INVALID",
        "Your GitHub token is invalid. Please sign in with GitHub again.",
      );
    }
    if (!tokenInfo.hasRepoScope) {
      throw new ApiError(
        401,
        "GITHUB_NEEDS_REAUTH",
        "GitHub access needs repository permission (repo scope). Please re-authorize to continue.",
      );
    }

    console.log(`[GitHub Repos] Calling GitHub API with token...`);
    const repositories = await listGitHubRepositories(tokenInfo.token);
    console.log(`[GitHub Repos] Got ${repositories.length} repositories from GitHub`);

    const connected = await prisma.repository.findMany({
      where: { userId: user.id },
      select: { fullName: true },
    });
    const connectedSet = new Set(connected.map((repo) => repo.fullName));

    return NextResponse.json({
      repositories: repositories.map((repo) => ({
        ...repo,
        githubId: repo.id,
        connected: connectedSet.has(repo.fullName),
      })),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`[GitHub Repos] API Error: ${error.code} - ${error.message}`);
    } else {
      console.error(`[GitHub Repos] Unexpected error:`, error);
    }
    return apiErrorResponse(error);
  }
}
