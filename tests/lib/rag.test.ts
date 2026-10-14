import { describe, it, expect } from "vitest";
import {
  RAG_SYSTEM_PROMPT,
  buildEvidenceContext,
  generateConversationTitle,
  estimateTokens,
  truncateEvidence,
} from "@/lib/ai/system-prompts";

describe("RAG System Prompts", () => {
  describe("RAG_SYSTEM_PROMPT", () => {
    it("is a non-empty string", () => {
      expect(RAG_SYSTEM_PROMPT.length).toBeGreaterThan(100);
    });

    it("mentions evidence-based answering", () => {
      expect(RAG_SYSTEM_PROMPT).toContain("evidence");
    });

    it("mentions hallucination control", () => {
      expect(RAG_SYSTEM_PROMPT).toContain("Never invent");
    });
  });

  describe("buildEvidenceContext", () => {
    it("formats chunks with file paths and content", () => {
      const chunks = [
        {
          path: "src/auth.ts",
          content: "function auth() {}",
          startLine: 1,
          endLine: 3,
          chunkType: "function",
          symbolName: "auth",
          score: 0.85,
          matchType: "vector" as const,
        },
      ];

      const ctx = buildEvidenceContext(chunks);
      expect(ctx).toContain("src/auth.ts");
      expect(ctx).toContain("auth");
      expect(ctx).toContain("function auth() {}");
    });

    it("returns a no-evidence message when empty", () => {
      const ctx = buildEvidenceContext([]);
      expect(ctx).toContain("No relevant code");
    });

    it("includes multiple code sections", () => {
      const chunks = [
        {
          path: "a.ts",
          content: "code A",
          startLine: 1,
          endLine: 1,
          chunkType: "function",
          symbolName: null,
          score: 0.5,
          matchType: "fulltext" as const,
        },
        {
          path: "b.ts",
          content: "code B",
          startLine: 5,
          endLine: 10,
          chunkType: "class",
          symbolName: "Foo",
          score: 0.7,
          matchType: "both" as const,
        },
      ];

      const ctx = buildEvidenceContext(chunks);
      expect(ctx).toContain("a.ts");
      expect(ctx).toContain("b.ts");
      expect(ctx).toContain("code A");
      expect(ctx).toContain("code B");
    });
  });

  describe("generateConversationTitle", () => {
    it("truncates long messages at word boundary", () => {
      const title = generateConversationTitle(
        "How does the authentication system work in this project and what are the dependencies?",
      );
      expect(title.length).toBeLessThanOrEqual(60);
      expect(title).not.toMatch(/\s$/); // No trailing space
    });

    it("keeps short messages intact", () => {
      const title = generateConversationTitle("auth?");
      expect(title).toBe("auth?");
    });
  });

  describe("estimateTokens", () => {
    it("returns approximately char_count / 4", () => {
      expect(estimateTokens("hello")).toBe(2); // 5 chars / 4 = 1.25, ceil = 2
      expect(estimateTokens("1234")).toBe(1);
      expect(estimateTokens("12345678")).toBe(2);
    });
  });

  describe("truncateEvidence", () => {
    it("returns all chunks when under budget", () => {
      const chunks = [
        { content: "short" },
        { content: "also short" },
      ];
      const result = truncateEvidence(chunks, 10000);
      expect(result.length).toBe(2);
    });

    it("truncates when over budget", () => {
      const bigContent = "x".repeat(40000); // ~10000 tokens
      const chunks = [
        { content: bigContent },
        { content: bigContent },
        { content: bigContent },
      ];
      const result = truncateEvidence(chunks, 5000); // 5000 tokens budget
      expect(result.length).toBeLessThan(3);
    });

    it("preserves chunk structure", () => {
      const chunks = [{ content: "test", extra: "field" }];
      const result = truncateEvidence(chunks, 10000);
      expect(result[0]).toHaveProperty("extra", "field");
    });
  });
});
