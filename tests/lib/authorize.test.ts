import { describe, expect, it } from "vitest";

import { decideRouteAccess } from "@/lib/authorize";

describe("decideRouteAccess", () => {
  it("blocks unauthenticated access to protected routes", () => {
    expect(decideRouteAccess("/dashboard", false)).toEqual({ allowed: false });
    expect(decideRouteAccess("/repositories", false)).toEqual({ allowed: false });
    expect(decideRouteAccess("/settings", false)).toEqual({ allowed: false });
    expect(decideRouteAccess("/chat", false)).toEqual({ allowed: false });
    expect(decideRouteAccess("/architecture", false)).toEqual({ allowed: false });
    expect(decideRouteAccess("/impact", false)).toEqual({ allowed: false });
    expect(decideRouteAccess("/ai-insights", false)).toEqual({ allowed: false });
  });

  it("allows /docs as public (marketing layout)", () => {
    expect(decideRouteAccess("/docs", false)).toEqual({ allowed: true });
    expect(decideRouteAccess("/docs/something", false)).toEqual({ allowed: true });
  });

  it("protects nested protected paths", () => {
    expect(decideRouteAccess("/dashboard/overview", false)).toEqual({ allowed: false });
    expect(decideRouteAccess("/repositories/abc123/chat", false)).toEqual({ allowed: false });
  });

  it("allows authenticated users into protected routes", () => {
    expect(decideRouteAccess("/dashboard", true)).toEqual({ allowed: true });
    expect(decideRouteAccess("/repositories", true)).toEqual({ allowed: true });
  });

  it("sends authenticated users away from the login page", () => {
    expect(decideRouteAccess("/login", true)).toEqual({ allowed: false, redirectTo: "/dashboard" });
  });

  it("allows public pages for everyone", () => {
    expect(decideRouteAccess("/", false)).toEqual({ allowed: true });
    expect(decideRouteAccess("/", true)).toEqual({ allowed: true });
    expect(decideRouteAccess("/privacy", false)).toEqual({ allowed: true });
    expect(decideRouteAccess("/login", false)).toEqual({ allowed: true });
  });

  it("allows /docs as a public page (marketing layout)", () => {
    expect(decideRouteAccess("/docs", false)).toEqual({ allowed: true });
    expect(decideRouteAccess("/docs", true)).toEqual({ allowed: true });
  });
});
