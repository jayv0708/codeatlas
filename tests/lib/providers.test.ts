/**
 * Tests for AI provider abstraction (Phase 6).
 *
 * Tests the factory, provider selection, and fallback behavior.
 * Does NOT make real API calls — validates the abstraction layer.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { getAIProvider, resetAIProvider } from "@/lib/ai/providers";
import { cacheGet, cacheSet, cacheGetOrSet, cacheDelete, cacheDeletePrefix } from "@/lib/cache";

describe("AI Provider Factory", () => {
  beforeEach(() => {
    resetAIProvider();
    delete process.env.AI_PROVIDER;
  });

  it("defaults to Gemini when AI_PROVIDER is not set", () => {
    const provider = getAIProvider();
    expect(provider.name).toBe("gemini");
  });

  it("returns Claude for AI_PROVIDER=claude", () => {
    process.env.AI_PROVIDER = "claude";
    const provider = getAIProvider();
    expect(provider.name).toBe("claude");
  });

  it("returns Ollama for AI_PROVIDER=ollama", () => {
    process.env.AI_PROVIDER = "ollama";
    process.env.OLLAMA_BASE_URL = "http://localhost:11434";
    const provider = getAIProvider();
    expect(provider.name).toBe("ollama");
  });

  it("caches the provider singleton", () => {
    const a = getAIProvider();
    const b = getAIProvider();
    expect(a).toBe(b);
  });

  it("resetAIProvider creates a new instance", () => {
    const a = getAIProvider();
    resetAIProvider();
    const b = getAIProvider();
    expect(a).not.toBe(b);
  });

  it("defaults to gemini for unknown provider name", () => {
    process.env.AI_PROVIDER = "unknown-provider";
    const provider = getAIProvider();
    expect(provider.name).toBe("gemini");
  });
});

describe("In-Memory Cache", () => {
  beforeEach(() => {
    // Clear cache between tests
    cacheDeletePrefix("test-");
  });

  it("returns undefined for missing keys", () => {
    expect(cacheGet("test-missing")).toBeUndefined();
  });

  it("stores and retrieves values", () => {
    cacheSet("test-key", "hello", 60);
    expect(cacheGet("test-key")).toBe("hello");
  });

  it("expires entries after TTL", () => {
    cacheSet("test-expire", "gone", 0); // 0-second TTL = expired immediately
    expect(cacheGet("test-expire")).toBeUndefined();
  });

  it("cacheGetOrSet computes on miss", async () => {
    const result = await cacheGetOrSet("test-compute", async () => 42, 60);
    expect(result).toBe(42);
  });

  it("cacheGetOrSet returns cached value on hit", async () => {
    cacheSet("test-cached", "cached-value", 60);
    let computeCount = 0;
    const result = await cacheGetOrSet(
      "test-cached",
      async () => {
        computeCount++;
        return "new-value";
      },
      60,
    );
    expect(result).toBe("cached-value");
    expect(computeCount).toBe(0);
  });

  it("cacheDelete removes entry", () => {
    cacheSet("test-del", "bye", 60);
    cacheDelete("test-del");
    expect(cacheGet("test-del")).toBeUndefined();
  });

  it("cacheDeletePrefix removes matching entries", () => {
    cacheSet("test-pfx:a", 1, 60);
    cacheSet("test-pfx:b", 2, 60);
    cacheSet("other:x", 3, 60);
    cacheDeletePrefix("test-pfx:");
    expect(cacheGet("test-pfx:a")).toBeUndefined();
    expect(cacheGet("test-pfx:b")).toBeUndefined();
    expect(cacheGet("other:x")).toBe(3);
  });

  it("supports complex objects", () => {
    const obj = { files: [1, 2, 3], name: "test" };
    cacheSet("test-obj", obj, 60);
    expect(cacheGet("test-obj")).toEqual(obj);
  });
});
