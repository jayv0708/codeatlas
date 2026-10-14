import { describe, expect, it } from "vitest";

import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows requests within the limit", () => {
    const result = rateLimit("test-key", { max: 5, windowMs: 60_000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  it("blocks requests exceeding the limit", () => {
    const key = `block-test-${Date.now()}`;
    for (let i = 0; i < 3; i++) {
      rateLimit(key, { max: 3, windowMs: 60_000 });
    }
    const result = rateLimit(key, { max: 3, windowMs: 60_000 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("tracks remaining count correctly", () => {
    const key = `remaining-test-${Date.now()}`;
    const r1 = rateLimit(key, { max: 5, windowMs: 60_000 });
    expect(r1.remaining).toBe(4);

    const r2 = rateLimit(key, { max: 5, windowMs: 60_000 });
    expect(r2.remaining).toBe(3);
  });

  it("different keys are independent", () => {
    const keyA = `independent-a-${Date.now()}`;
    const keyB = `independent-b-${Date.now()}`;

    rateLimit(keyA, { max: 1, windowMs: 60_000 });
    rateLimit(keyA, { max: 1, windowMs: 60_000 }); // should block

    const resultB = rateLimit(keyB, { max: 1, windowMs: 60_000 });
    expect(resultB.allowed).toBe(true); // different key, should pass
  });
});

describe("rateLimitResponse", () => {
  it("returns null when allowed", () => {
    const result = rateLimitResponse("resp-test", { max: 10, windowMs: 60_000 });
    expect(result.limited).toBe(false);
    expect(result.response).toBeNull();
  });

  it("returns 429 response when limited", () => {
    const key = `resp-block-${Date.now()}`;
    for (let i = 0; i < 2; i++) {
      rateLimitResponse(key, { max: 2, windowMs: 60_000 });
    }
    const result = rateLimitResponse(key, { max: 2, windowMs: 60_000 });
    expect(result.limited).toBe(true);
    expect(result.response).not.toBeNull();
    expect(result.response!.status).toBe(429);
  });

  it("includes Retry-After header", () => {
    const key = `retry-${Date.now()}`;
    for (let i = 0; i < 2; i++) {
      rateLimitResponse(key, { max: 2, windowMs: 60_000 });
    }
    const result = rateLimitResponse(key, { max: 2, windowMs: 60_000 });
    expect(result.response!.headers.get("Retry-After")).toBeTruthy();
  });
});
