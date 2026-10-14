import { describe, it, expect } from "vitest";
import { chunkFile, chunkToEmbeddingText } from "@/lib/ai/chunker";

describe("Code Chunker", () => {
  const baseInput = {
    fileId: "file-1",
    repositoryId: "repo-1",
    path: "src/auth.ts",
    language: "typescript" as const,
  };

  describe("chunkFile with symbols", () => {
    it("creates chunks from parsed symbols", () => {
      const content = [
        "import { verify } from 'jsonwebtoken';",
        "",
        "export function authenticate(token: string) {",
        "  return verify(token, process.env.SECRET);",
        "}",
        "",
        "export function authorize(role: string) {",
        "  return (req) => req.user.role === role;",
        "}",
      ].join("\n");

      const symbols = [
        { name: "authenticate", type: "function", startLine: 3, endLine: 6 },
        { name: "authorize", type: "function", startLine: 8, endLine: 10 },
      ];

      const chunks = chunkFile({ ...baseInput, content }, symbols);

      // Should have at least: header + 2 functions
      expect(chunks.length).toBeGreaterThanOrEqual(2);

      // Check header chunk exists
      const header = chunks.find((c) => c.chunkType === "header");
      expect(header).toBeDefined();
      expect(header!.content).toContain("import");

      // Check function chunks
      const authFn = chunks.find((c) => c.symbolName === "authenticate");
      expect(authFn).toBeDefined();
      expect(authFn!.chunkType).toBe("function");
      expect(authFn!.content).toContain("verify");
    });

    it("creates class chunks", () => {
      const content = [
        "export class AuthService {",
        "  private secret: string;",
        "",
        "  constructor(secret: string) {",
        "    this.secret = secret;",
        "  }",
        "",
        "  validate(token: string) {",
        "    return verify(token, this.secret);",
        "  }",
        "}",
      ].join("\n");

      const symbols = [
        { name: "AuthService", type: "class", startLine: 1, endLine: 11 },
      ];

      const chunks = chunkFile({ ...baseInput, content }, symbols);
      const classChunk = chunks.find((c) => c.symbolName === "AuthService");
      expect(classChunk).toBeDefined();
      expect(classChunk!.chunkType).toBe("class");
    });
  });

  describe("chunkFile without symbols (fallback)", () => {
    it("falls back to brace-based chunking", () => {
      const content = [
        "// Header comment",
        "import { something } from 'lib';",
        "",
        "function helper() {",
        "  return 42;",
        "}",
        "",
        "export function main() {",
        "  return helper();",
        "}",
      ].join("\n");

      const chunks = chunkFile({ ...baseInput, content });

      // Should find functions
      expect(chunks.length).toBeGreaterThanOrEqual(1);
      const fnChunk = chunks.find((c) => c.chunkType === "function");
      expect(fnChunk).toBeDefined();
    });

    it("handles empty files gracefully", () => {
      const chunks = chunkFile({ ...baseInput, content: "" });
      expect(chunks).toEqual([]);
    });

    it("handles files with only comments", () => {
      const chunks = chunkFile({
        ...baseInput,
        content: "// This is a comment\n/* block comment */",
      });
      // May produce a header chunk or empty — either is acceptable
      expect(chunks.length).toBeLessThanOrEqual(1);
    });
  });

  describe("chunkToEmbeddingText", () => {
    it("includes file path, language, symbol name, and content", () => {
      const chunk = {
        ...baseInput,
        chunkType: "function",
        symbolName: "authenticate",
        content: "function authenticate() {}",
        startLine: 1,
        endLine: 1,
        tokenCount: 3,
        hash: "abc",
      };

      const text = chunkToEmbeddingText(chunk);
      expect(text).toContain("src/auth.ts");
      expect(text).toContain("typescript");
      expect(text).toContain("authenticate");
      expect(text).toContain("function");
    });
  });
});
