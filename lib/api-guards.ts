/**
 * Reusable API route guards.
 *
 * Usage in a route handler:
 *   const guard = await apiGuard(request, { rateLimit: { max: 30 } });
 *   if (guard) return guard;  // early-return 429 / 401 / 404
 */

import { NextRequest } from "next/server";

import { ApiError, requireApiUser } from "@/lib/api";
import { rateLimitResponse, type RateLimitConfig } from "@/lib/rate-limit";
import { prisma } from "@/services/db";

export interface ApiGuardOptions {
  rateLimit?: RateLimitConfig & { keySuffix?: string };
  /** If true, look up the repository and verify ownership. */
  repositoryId?: string;
}

export interface ApiGuardResult {
  user: { id: string };
  repository?: { id: string; name: string; fullName: string | null; status: string };
}

/**
 * Combined guard: auth → rate-limit → optional repository ownership.
 * Returns a NextResponse on failure (return early from the route handler).
 */
export async function apiGuard(
  request: NextRequest,
  options?: ApiGuardOptions,
): Promise<ApiGuardResult | Response> {
  // 1. Authentication
  let user: { id: string };
  try {
    user = await requireApiUser();
  } catch (error) {
    if (error instanceof ApiError) {
      return new Response(
        JSON.stringify({ error: { code: error.code, message: error.message } }),
        { status: error.status, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(
      JSON.stringify({ error: { code: "UNAUTHENTICATED", message: "You must be signed in." } }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  // 2. Rate limiting
  if (options?.rateLimit) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const key = `${ip}:${options.rateLimit.keySuffix ?? "api"}`;
    const result = rateLimitResponse(key, options.rateLimit);
    if (result.limited) return result.response;
  }

  // 3. Repository ownership
  let repository: ApiGuardResult["repository"] | undefined;
  if (options?.repositoryId) {
    const repo = await prisma.repository.findFirst({
      where: { id: options.repositoryId, userId: user.id },
      select: { id: true, name: true, fullName: true, status: true },
    });
    if (!repo) {
      return new Response(
        JSON.stringify({ error: { code: "NOT_FOUND", message: "Repository not found." } }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }
    repository = repo;
  }

  return { user, repository };
}

// ── Input validators ─────────────────────────────────────────────────────────

export function validateId(value: unknown): string {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(value)) {
    throw new ApiError(400, "INVALID_ID", "Invalid identifier.");
  }
  return value;
}

export function validateMessage(body: unknown): { message: string } {
  if (!body || typeof body !== "object") {
    throw new ApiError(400, "INVALID_BODY", "Request body is required.");
  }
  const { message } = body as Record<string, unknown>;
  if (typeof message !== "string" || message.trim().length === 0) {
    throw new ApiError(400, "INVALID_MESSAGE", "Message is required.");
  }
  if (message.length > 10_000) {
    throw new ApiError(400, "MESSAGE_TOO_LONG", "Message must be under 10,000 characters.");
  }
  return { message: message.trim() };
}

export function validateFullName(value: unknown): string {
  if (typeof value !== "string") {
    throw new ApiError(400, "INVALID_REPOSITORY", "Repository name is required.");
  }
  const trimmed = value.trim();
  if (!/^[\w.-]+\/[\w.-]+$/.test(trimmed) || trimmed.length > 100) {
    throw new ApiError(
      400,
      "INVALID_REPOSITORY",
      "Invalid repository identifier (expected owner/name).",
    );
  }
  return trimmed;
}
