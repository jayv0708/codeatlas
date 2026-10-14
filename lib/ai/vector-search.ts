/**
 * CodeAtlas Vector Search Service
 *
 * Hybrid retrieval combining:
 * 1. Vector similarity search via pgvector (semantic)
 * 2. PostgreSQL full-text search (keyword/syntactic)
 *
 * Both are repository-scoped. Results are merged by weighted score.
 */

import { prisma } from "../db";
import {
  generateEmbedding,
  vectorToPgvector,
} from "./embeddings";
import { chunkToEmbeddingText } from "./chunker";

export interface SearchResult {
  chunkId: string;
  fileId: string;
  repositoryId: string;
  path: string;
  language: string | null;
  chunkType: string;
  symbolName: string | null;
  content: string;
  startLine: number;
  endLine: number;
  score: number;
  matchType: "vector" | "fulltext" | "both";
}

export interface SearchOptions {
  repositoryId: string;
  query: string;
  limit?: number;
  minScore?: number;
  chunkType?: string;
  language?: string;
}

/**
 * Store an embedding for a code chunk in pgvector.
 */
export async function storeEmbedding(
  chunkId: string,
  content: string,
  prismaClient?: typeof prisma,
): Promise<void> {
  const db = prismaClient ?? prisma;
  const embeddingText = chunkToEmbeddingText({
    content,
    path: "",
    chunkType: "",
    language: null,
    symbolName: null,
    fileId: "",
    repositoryId: "",
    startLine: 0,
    endLine: 0,
    tokenCount: 0,
    hash: "",
  });
  const vector = generateEmbedding(embeddingText);
  const pgvector = vectorToPgvector(vector);

  await db.$executeRawUnsafe(
    `INSERT INTO "Embedding" ("id", "chunkId", "vector", "model", "createdAt")
     VALUES (gen_random_uuid()::text, $1, $2::vector, 'ngram-rp', NOW())
     ON CONFLICT ("chunkId") DO UPDATE SET "vector" = $2::vector, "model" = 'ngram-rp'`,
    chunkId,
    pgvector,
  );
}

/**
 * Search for relevant code chunks using hybrid retrieval.
 */
export async function searchCode(
  options: SearchOptions,
  prismaClient?: typeof prisma,
): Promise<SearchResult[]> {
  const db = prismaClient ?? prisma;
  const { repositoryId, query, limit = 10, minScore = 0.1, chunkType, language } = options;

  // Generate query embedding
  const queryEmbedding = generateEmbedding(query);
  const queryVector = vectorToPgvector(queryEmbedding);

  // ── Vector similarity search ────────────────────────────────────────
  // Build params for vector query: [repositoryId, ...filters, queryVector, limit]
  const vectorParams: (string | number)[] = [repositoryId];
  const vectorFilters: string[] = [`c."repositoryId" = $1`];
  let vIdx = 2;
  if (chunkType) { vectorFilters.push(`c."chunkType" = $${vIdx}`); vectorParams.push(chunkType); vIdx++; }
  if (language)  { vectorFilters.push(`c."language" = $${vIdx}`);  vectorParams.push(language);  vIdx++; }
  vectorParams.push(queryVector, Math.min(limit * 3, 30));
  const vQueryVectorIdx = vIdx;
  const vLimitIdx = vIdx + 1;

  const vectorResults: Array<{ chunkId: string; score: number }> =
    await db.$queryRawUnsafe(
      `SELECT c."id" as "chunkId",
              1 - (e."vector" <=> $${vQueryVectorIdx}::vector) as score
       FROM "CodeChunk" c
       JOIN "Embedding" e ON e."chunkId" = c."id"
       WHERE ${vectorFilters.join(' AND ')}
         AND e."vector" IS NOT NULL
       ORDER BY e."vector" <=> $${vQueryVectorIdx}::vector
       LIMIT $${vLimitIdx}`,
      ...vectorParams,
    );

  // ── Full-text search ────────────────────────────────────────────────
  const tsQuery = query
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      const sanitized = w.replace(/[|&():!@#*]/g, '');
      return sanitized ? `${sanitized}:*` : '';
    })
    .filter(Boolean)
    .join(' & ');

  // Build params for fulltext query: [repositoryId, ...filters, tsQuery, limit]
  const ftParams: (string | number)[] = [repositoryId];
  const ftFilters: string[] = [`c."repositoryId" = $1`];
  let ftIdx = 2;
  if (chunkType) { ftFilters.push(`c."chunkType" = $${ftIdx}`); ftParams.push(chunkType); ftIdx++; }
  if (language)  { ftFilters.push(`c."language" = $${ftIdx}`);  ftParams.push(language);  ftIdx++; }
  ftParams.push(tsQuery, Math.min(limit * 2, 20));
  const ftTsIdx = ftIdx;
  const ftLimitIdx = ftIdx + 1;

  const fulltextResults: Array<{ chunkId: string; score: number }> =
    tsQuery
      ? await db.$queryRawUnsafe(
          `SELECT c."id" as "chunkId",
                  ts_rank_cd(
                    to_tsvector('english', coalesce(c."content", '') || ' ' || coalesce(c."path", '') || ' ' || coalesce(c."symbolName", '')),
                    to_tsquery('english', $${ftTsIdx}),
                    32
                  ) as score
           FROM "CodeChunk" c
           WHERE ${ftFilters.join(' AND ')}
             AND to_tsvector('english', coalesce(c."content", '') || ' ' || coalesce(c."path", '') || ' ' || coalesce(c."symbolName", ''))
                 @@ to_tsquery('english', $${ftTsIdx})
           ORDER BY score DESC
           LIMIT $${ftLimitIdx}`,
          ...ftParams,
        )
      : [];

  // Merge results by chunkId, combining scores
  const scoreMap = new Map<
    string,
    { vectorScore: number; fulltextScore: number; matchType: "vector" | "fulltext" | "both" }
  >();

  for (const r of vectorResults) {
    const existing = scoreMap.get(r.chunkId);
    if (existing) {
      existing.vectorScore = r.score;
      existing.matchType = "both";
    } else {
      scoreMap.set(r.chunkId, {
        vectorScore: r.score,
        fulltextScore: 0,
        matchType: "vector",
      });
    }
  }

  for (const r of fulltextResults) {
    const existing = scoreMap.get(r.chunkId);
    if (existing) {
      existing.fulltextScore = r.score;
      existing.matchType = "both";
    } else {
      scoreMap.set(r.chunkId, {
        vectorScore: 0,
        fulltextScore: r.score,
        matchType: "fulltext",
      });
    }
  }

  // Weighted score: 60% vector + 40% fulltext
  const VECTOR_WEIGHT = 0.6;
  const FULLTEXT_WEIGHT = 0.4;

  const merged = Array.from(scoreMap.entries())
    .map(([chunkId, scores]) => ({
      chunkId,
      combinedScore:
        scores.vectorScore * VECTOR_WEIGHT + scores.fulltextScore * FULLTEXT_WEIGHT,
      matchType: scores.matchType,
    }))
    .filter((r) => r.combinedScore >= minScore)
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, limit);

  if (merged.length === 0) return [];

  // Fetch full chunk data for results
  const chunkIds = merged.map((r) => r.chunkId);
  const chunks = await db.codeChunk.findMany({
    where: { id: { in: chunkIds } },
  });

  const chunkMap = new Map(chunks.map((c) => [c.id, c]));

  return merged
    .map((r) => {
      const chunk = chunkMap.get(r.chunkId);
      if (!chunk) return null;
      return {
        chunkId: chunk.id,
        fileId: chunk.fileId,
        repositoryId: chunk.repositoryId,
        path: chunk.path,
        language: chunk.language,
        chunkType: chunk.chunkType,
        symbolName: chunk.symbolName,
        content: chunk.content,
        startLine: chunk.startLine,
        endLine: chunk.endLine,
        score: r.combinedScore,
        matchType: r.matchType,
      };
    })
    .filter(Boolean) as SearchResult[];
}
