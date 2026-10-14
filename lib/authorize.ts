export interface RouteAccessDecision {
  allowed: boolean;
  /** When set, the request should be redirected here instead. */
  redirectTo?: string;
}

const PROTECTED_PREFIXES = ["/dashboard", "/repositories", "/settings", "/chat", "/architecture", "/impact", "/ai-insights"];

/**
 * Pure route-access decision logic (extracted so it is unit-testable).
 *
 * - Protected paths require a session; otherwise redirect to the sign-in page
 *   (middleware lets Auth.js handle that redirect).
 * - Authenticated users hitting /login are sent straight to /dashboard.
 */
export function decideRouteAccess(pathname: string, isLoggedIn: boolean): RouteAccessDecision {
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected && !isLoggedIn) {
    return { allowed: false };
  }

  if (pathname === "/login" && isLoggedIn) {
    return { allowed: false, redirectTo: "/dashboard" };
  }

  return { allowed: true };
}
