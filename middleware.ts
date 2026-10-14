import { NextRequest, NextResponse } from "next/server";

import { decideRouteAccess } from "@/lib/authorize";

/**
 * Edge middleware — fast pre-check layer.
 *
 * Auth.js v5 database sessions cannot be resolved on the edge runtime
 * (the Prisma adapter is Node-only), so we deliberately do NOT run NextAuth
 * here. Instead this middleware:
 *   1. Redirects cookie-less users away from protected routes (UX: no flash
 *      of the page shell).
 *   2. Sends signed-in users away from /login.
 *
 * The AUTHORITATIVE session check happens server-side in `requireSession()`
 * (database-backed, in `lib/session.ts`). A stale or forged cookie that passes
 * this pre-check is still rejected there.
 */
const SESSION_COOKIE = "authjs.session-token";
const SECURE_SESSION_COOKIE = "__Secure-authjs.session-token";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = Boolean(
    request.cookies.get(SESSION_COOKIE) ?? request.cookies.get(SECURE_SESSION_COOKIE),
  );

  const decision = decideRouteAccess(pathname, hasSessionCookie);

  if (decision.allowed) {
    return NextResponse.next();
  }

  if (decision.redirectTo) {
    return NextResponse.redirect(new URL(decision.redirectTo, request.url));
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/repositories/:path*",
    "/settings/:path*",
    "/chat/:path*",
    "/architecture/:path*",
    "/impact/:path*",
    "/ai-insights/:path*",
    "/login",
    // Forgot/reset password and verify-email are PUBLIC — do not middleware-protect them
  ],
};
