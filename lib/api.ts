import { NextResponse } from "next/server";

import { auth } from "@/services/auth";
import { GitHubApiError } from "@/lib/github";

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** Authenticated user id, always derived from the server-side session. */
export async function requireApiUser(): Promise<{ id: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new ApiError(401, "UNAUTHENTICATED", "You must be signed in.");
    }
    return { id: session.user.id };
  } catch (error) {
    // If auth() throws (corrupted cookie, DB failure), convert to a
    // clean 401 instead of an unhandled exception.
    if (error instanceof ApiError) throw error;
    console.error("[API Auth] Session check failed:", error instanceof Error ? error.message : error);
    throw new ApiError(401, "UNAUTHENTICATED", "You must be signed in.");
  }
}

export function apiErrorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }
  if (error instanceof GitHubApiError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }
  console.error("Unhandled API error:", error);
  return NextResponse.json(
    { error: { code: "INTERNAL", message: "Something went wrong. Please try again." } },
    { status: 500 },
  );
}
