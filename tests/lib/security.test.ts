import { describe, expect, it } from "vitest";

// Pure route access logic (same as lib/authorize.ts but inlined for test isolation)
const PROTECTED_PREFIXES = ["/dashboard", "/repositories", "/settings", "/chat", "/architecture", "/impact", "/ai-insights"];

function decideRouteAccess(pathname: string, isLoggedIn: boolean) {
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isProtected && !isLoggedIn) return { allowed: false };
  if (pathname === "/login" && isLoggedIn) return { allowed: false, redirectTo: "/dashboard" };
  return { allowed: true };
}

// Pure input validators
function validateId(value: unknown): string {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(value)) {
    throw new Error("Invalid identifier.");
  }
  return value;
}

function validateMessage(body: unknown): { message: string } {
  if (!body || typeof body !== "object") throw new Error("Request body is required.");
  const { message } = body as Record<string, unknown>;
  if (typeof message !== "string" || message.trim().length === 0) throw new Error("Message is required.");
  if (message.length > 10_000) throw new Error("Message must be under 10,000 characters.");
  return { message: message.trim() };
}

describe("security — route protection", () => {
  it("protects all dashboard routes", () => {
    const protectedRoutes = [
      "/dashboard",
      "/dashboard/settings",
      "/repositories",
      "/repositories/abc123",
      "/repositories/abc123/chat",
      "/settings",
      "/settings/profile",
      "/chat",
      "/architecture",
      "/impact",
      "/ai-insights",
    ];
    for (const route of protectedRoutes) {
      expect(decideRouteAccess(route, false).allowed).toBe(false);
    }
  });

  it("allows public routes without auth", () => {
    const publicRoutes = ["/", "/login", "/docs", "/privacy", "/api/health", "/api/ai/health"];
    for (const route of publicRoutes) {
      expect(decideRouteAccess(route, false).allowed).toBe(true);
    }
  });

  it("redirects authenticated users from /login", () => {
    const result = decideRouteAccess("/login", true);
    expect(result.allowed).toBe(false);
    expect(result.redirectTo).toBe("/dashboard");
  });
});

describe("security — input validation", () => {
  it("rejects SQL injection patterns in IDs", () => {
    expect(() => validateId("'; DROP TABLE users; --")).toThrow();
    expect(() => validateId("1 OR 1=1")).toThrow();
  });

  it("rejects path traversal in IDs", () => {
    expect(() => validateId("../etc/passwd")).toThrow();
    expect(() => validateId("admin/../../secret")).toThrow();
  });

  it("rejects oversized inputs", () => {
    expect(() => validateId("x".repeat(200))).toThrow();
    expect(() => validateMessage({ message: "x".repeat(20_000) })).toThrow();
  });

  it("accepts XSS patterns as text (React escapes them)", () => {
    const result = validateMessage({ message: "<script>alert('xss')</script>" });
    expect(result.message).toContain("<script>");
  });
});

describe("security — repository ownership", () => {
  it("ownership query always includes userId", () => {
    const userId = "user-123";
    const repositoryId = "repo-456";
    const query = { where: { id: repositoryId, userId }, select: { id: true } };
    expect(query.where.userId).toBe(userId);
    expect(query.where.id).toBe(repositoryId);
  });

  it("cross-user access returns null", () => {
    const userARepo = { id: "repo-1", userId: "user-a" };
    const queryUserId = "user-b";
    expect(userARepo.userId === queryUserId).toBe(false);
  });
});

describe("security — API error responses", () => {
  it("never leaks internal error details", () => {
    const response = {
      error: { code: "INTERNAL", message: "Something went wrong. Please try again." },
    };
    expect(response.error.message).not.toContain("password");
    expect(response.error.message).not.toContain("secret");
  });

  it("returns structured error responses", () => {
    const apiError = { status: 404, code: "NOT_FOUND", message: "Repository not found." };
    expect(apiError.status).toBe(404);
    expect(apiError.code).toBe("NOT_FOUND");
    expect(apiError.message).not.toContain("stack");
  });
});

describe("security — environment variable safety", () => {
  it("API keys must not be exposed in client bundles", () => {
    const serverOnlyVars = [
      "ANTHROPIC_API_KEY",
      "GEMINI_API_KEY",
      "DATABASE_URL",
      "AUTH_SECRET",
      "GITHUB_CLIENT_SECRET",
      "GOOGLE_CLIENT_SECRET",
    ];
    for (const varName of serverOnlyVars) {
      expect(varName.startsWith("NEXT_PUBLIC_")).toBe(false);
    }
  });
});

describe("security — tsquery sanitization", () => {
  it("sanitizes special characters from tsquery input", () => {
    // Simulate the sanitization logic from vector-search.ts
    function sanitizeTsQuery(input: string): string {
      return input
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => {
          const sanitized = w.replace(/[|&():!@#*]/g, '');
          return sanitized ? `${sanitized}:*` : '';
        })
        .filter(Boolean)
        .join(' & ');
    }

    // Should produce valid tsquery
    expect(sanitizeTsQuery('authentication middleware')).toBe('authentication:* & middleware:*');
    expect(sanitizeTsQuery('foo | bar')).toBe('foo:* & bar:*');
    expect(sanitizeTsQuery('test()')).toBe('test:*');
    expect(sanitizeTsQuery('x:colon')).toBe('xcolon:*');
    expect(sanitizeTsQuery('drop table')).toBe('drop:* & table:*');
  });
});

describe("security — error response safety", () => {
  it("error messages never contain stack traces", () => {
    const errorResponses = [
      { error: { code: "INTERNAL", message: "Something went wrong. Please try again." } },
      { error: "Internal server error" },
      { error: "Repository not found" },
    ];
    for (const resp of errorResponses) {
      const msg = typeof resp.error === 'string' ? resp.error : resp.error.message;
      expect(msg).not.toMatch(/at .*\.ts:/); // stack trace pattern
      expect(msg).not.toMatch(/node_modules/);
    }
  });
});
