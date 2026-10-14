/**
 * CodeAtlas Embedding Service
 *
 * Generates fixed-dimension (384-d) vectors from code text using character n-gram
 * hashing with random projection. No external API required — runs entirely in-process.
 *
 * How it works:
 * 1. Tokenize text into character 3-grams (e.g., "auth" → ["aut", "uth"])
 * 2. Hash each n-gram to one of D buckets using murmur3-style hash
 * 3. Accumulate signed weights via a deterministic random projection matrix
 * 4. L2-normalize the resulting vector
 *
 * This is a well-known technique (CharCNN / random bag-of-n-grams) that captures
 * text similarity without any training. Good enough for code search MVP.
 */

import { createHash } from "crypto";

const DIMENSION = 384;
const NGRAM_SIZE = 3;
const SEED = 42;

/**
 * Deterministic hash function for a string → unsigned 32-bit integer.
 * Uses SHA-256 for reproducibility across runs.
 */
function hashString(s: string): number {
  const h = createHash("sha256").update(`${SEED}:${s}`).digest();
  return h.readUInt32LE(0);
}

/**
 * Deterministic random sign for a given (ngram_index, bucket) pair.
 * Returns +1 or -1 — used as the random projection weight.
 */
function randomSign(ngramIdx: number, bucket: number): number {
  const h = createHash("sha256")
    .update(`${SEED}:${ngramIdx}:${bucket}`)
    .digest();
  return h[0] % 2 === 0 ? 1 : -1;
}

/**
 * Extract character n-grams from text, lowercased and filtered.
 */
function extractNgrams(text: string, n: number): string[] {
  const lower = text.toLowerCase();
  const ngrams: string[] = [];
  for (let i = 0; i <= lower.length - n; i++) {
    const gram = lower.slice(i, i + n);
    // Skip whitespace-only n-grams
    if (/\S/.test(gram)) {
      ngrams.push(gram);
    }
  }
  return ngrams;
}

/**
 * Generate a 384-dimensional embedding vector from text.
 *
 * @param text - The source text to embed
 * @returns Float32Array of length 384, L2-normalized
 */
export function generateEmbedding(text: string): Float32Array {
  if (!text || text.trim().length === 0) {
    return new Float32Array(DIMENSION);
  }

  const ngrams = extractNgrams(text, NGRAM_SIZE);
  const vector = new Float32Array(DIMENSION);

  // Hash each n-gram into the vector via random projection
  for (const ngram of ngrams) {
    const bucket = hashString(ngram) % DIMENSION;
    // The sign is deterministic per (ngram, bucket) pair
    const sign = randomSign(hashString(ngram), bucket);
    vector[bucket] += sign;
  }

  // L2-normalize
  let norm = 0;
  for (let i = 0; i < DIMENSION; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < DIMENSION; i++) {
      vector[i] /= norm;
    }
  }

  return vector;
}

/**
 * Convert Float32Array to pgvector string format: "[0.1,0.2,...]"
 */
export function vectorToPgvector(v: Float32Array): string {
  return `[${Array.from(v).join(",")}]`;
}

/**
 * Parse a pgvector string back to Float32Array.
 */
export function pgvectorToFloat32(s: string): Float32Array {
  const cleaned = s.replace(/[\[\]]/g, "");
  const nums = cleaned.split(",").map(Number);
  return new Float32Array(nums);
}

/**
 * Cosine similarity between two vectors.
 */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
