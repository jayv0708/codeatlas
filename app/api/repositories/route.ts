import { NextResponse } from "next/server";

import { ApiError, apiErrorResponse, requireApiUser } from "@/lib/api";
import { fetchRepositoryMeta, getGitHubTokenForUser } from "@/lib/github";
import { startIngestion } from "@/lib/ingestion/runner";
import { repositoryInclude, toRepositorySummary } from "@/lib/repositories";
import { prisma } from "@/services/db";

const FULL_NAME_RE = /^[\w.-]+\/[\w.-]+$/;

export async function GET() {
  try {
    const user = await requireApiUser();

    const repositories = await prisma.repository.findMany({
      where: { userId: user.id },
      include: repositoryInclude,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      repositories: repositories.map(toRepositorySummary),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();

    const body = (await request.json().catch(() => null)) as { fullName?: unknown } | null;
    const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
    if (!FULL_NAME_RE.test(fullName) || fullName.length > 100) {
      throw new ApiError(
        400,
        "INVALID_REPOSITORY",
        "Invalid repository identifier (expected owner/name).",
      );
    }

    const tokenInfo = await getGitHubTokenForUser(user.id);
    if (!tokenInfo) {
      throw new ApiError(
        401,
        "GITHUB_NOT_LINKED",
        "No GitHub account linked. Please sign in with GitHub first.",
      );
    }
    if (!tokenInfo.hasRepoScope) {
      throw new ApiError(
        401,
        "GITHUB_NEEDS_REAUTH",
        "GitHub access needs repository permission (repo scope). Please re-authorize to continue.",
      );
    }

    const meta = await fetchRepositoryMeta(tokenInfo.token, fullName);

    const existing = await prisma.repository.findUnique({
      where: { userId_fullName: { userId: user.id, fullName } },
    });

    const repository = existing
      ? await prisma.repository.update({
          where: { id: existing.id },
          data: {
            name: meta.name,
            githubId: BigInt(meta.id),
            description: meta.description,
            defaultBranch: meta.defaultBranch,
            language: meta.language,
            isPrivate: meta.isPrivate,
          },
        })
      : await prisma.repository.create({
          data: {
            userId: user.id,
            name: meta.name,
            githubId: BigInt(meta.id),
            fullName,
            description: meta.description,
            defaultBranch: meta.defaultBranch,
            language: meta.language,
            isPrivate: meta.isPrivate,
          },
        });

    const { jobId, alreadyRunning } = await startIngestion(repository.id, user.id);

    return NextResponse.json(
      {
        repository: {
          id: repository.id,
          name: repository.name,
          fullName: repository.fullName,
          status: repository.status,
          progress: repository.progress,
        },
        jobId,
        alreadyRunning,
      },
      { status: 202 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
