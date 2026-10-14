import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/services/auth";

/**
 * Clear corrupted session cookies to prevent redirect loops.
 */
async function clearSessionCookies() {
  try {
    const cookieStore = await cookies();
    cookieStore.set("authjs.session-token", "", { path: "/", maxAge: 0 });
    cookieStore.set("__Secure-authjs.session-token", "", { path: "/", maxAge: 0 });
  } catch {
    // Cookie clearing is best-effort
  }
}

/**
 * Try to get the session without crashing. Returns null if auth fails
 * (e.g. corrupted cookie, DB unreachable). Use this in pages that
 * should degrade gracefully rather than showing an error boundary.
 */
export async function safeSession() {
  try {
    const session = await auth();
    if (!session?.user) return null;
    return session;
  } catch (error) {
    console.error("[Auth] Session check failed (safeSession):", error instanceof Error ? error.message : error);
    await clearSessionCookies();
    return null;
  }
}

/**
 * Authoritative server-side session gate for protected pages.
 * Always derive the authenticated user from the session — never trust
 * client-provided identifiers (e.g. user ids in query params).
 *
 * When auth() fails due to a corrupted session cookie, we clear the
 * invalid cookie and redirect to login cleanly — preventing infinite
 * redirect loops and blank pages.
 */
export async function requireSession() {
  let session;
  try {
    session = await auth();
  } catch (error) {
    // Auth failed — likely a corrupted or stale session cookie.
    // Clear it so the next request starts fresh.
    console.error("[Auth] Session check failed:", error instanceof Error ? error.message : error);
    await clearSessionCookies();
    redirect("/login");
  }

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}
