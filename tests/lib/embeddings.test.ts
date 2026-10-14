import { describe, it, expect } from "vitest";
import {
  generateEmbedding,
  vectorToPgvector,
  pgvectorToFloat32,
  cosineSimilarity,
} from "@/lib/ai/embeddings";

describe("Embedding Service", () => {
  describe("generateEmbedding", () => {
    it("returns a Float32Array of length 384", () => {
      const vec = generateEmbedding("hello world");
      expect(vec).toBeInstanceOf(Float32Array);
      expect(vec.length).toBe(384);
    });

    it("returns zero vector for empty input", () => {
      const vec = generateEmbedding("");
      expect(Array.from(vec).every((v) => v === 0)).toBe(true);
    });

    it("returns zero vector for whitespace-only input", () => {
      const vec = generateEmbedding("   \n  \t  ");
      expect(Array.from(vec).every((v) => v === 0)).toBe(true);
    });

    it("produces L2-normalized vectors", () => {
      const vec = generateEmbedding("const x = 42;");
      let norm = 0;
      for (let i = 0; i < vec.length; i++) {
        norm += vec[i] * vec[i];
      }
      expect(Math.sqrt(norm)).toBeCloseTo(1.0, 5);
    });

    it("is deterministic — same input produces same output", () => {
      const a = generateEmbedding("function foo() { return 1; }");
      const b = generateEmbedding("function foo() { return 1; }");
      expect(Array.from(a)).toEqual(Array.from(b));
    });

    it("produces different vectors for different inputs", () => {
      const a = generateEmbedding("function auth() { return token; }");
      const b = generateEmbedding("SELECT * FROM users WHERE id = 1");
      const sim = cosineSimilarity(a, b);
      // These are very different texts — similarity should be low
      expect(sim).toBeLessThan(0.8);
    });

    it("produces similar vectors for similar inputs", () => {
      const a = generateEmbedding("function authenticateUser(token: string) { return verify(token); }");
      const b = generateEmbedding("function authenticateUser(token: string) { return validate(token); }");
      const sim = cosineSimilarity(a, b);
      // Very similar code — should have reasonable similarity
      expect(sim).toBeGreaterThan(0.5);
    });
  });

  describe("vectorToPgvector / pgvectorToFloat32", () => {
    it("round-trips correctly", () => {
      const original = generateEmbedding("round trip test");
      const pgv = vectorToPgvector(original);
      expect(pgv.startsWith("[")).toBe(true);
      expect(pgv.endsWith("]")).toBe(true);

      const restored = pgvectorToFloat32(pgv);
      expect(restored.length).toBe(384);
      for (let i = 0; i < 384; i++) {
        expect(restored[i]).toBeCloseTo(original[i], 6);
      }
    });
  });

  describe("cosineSimilarity", () => {
    it("returns 1.0 for identical vectors", () => {
      const v = generateEmbedding("identical test");
      expect(cosineSimilarity(v, v)).toBeCloseTo(1.0, 5);
    });

    it("returns 0.0 for orthogonal vectors", () => {
      const a = new Float32Array([1, 0, 0]);
      const b = new Float32Array([0, 1, 0]);
      expect(cosineSimilarity(a, b)).toBe(0);
    });

    it("throws on dimension mismatch", () => {
      const a = new Float32Array([1, 0]);
      const b = new Float32Array([1, 0, 0]);
      expect(() => cosineSimilarity(a, b)).toThrow("dimension mismatch");
    });
  });
});
