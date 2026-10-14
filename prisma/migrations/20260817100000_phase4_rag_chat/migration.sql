-- Phase 4: RAG + Chat (embeddings, chunks, conversations, messages)

-- CodeChunk table
CREATE TABLE "CodeChunk" (
  "id" TEXT NOT NULL,
  "repositoryId" TEXT NOT NULL,
  "fileId" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "language" TEXT,
  "chunkType" TEXT NOT NULL,
  "symbolName" TEXT,
  "content" TEXT NOT NULL,
  "startLine" INTEGER NOT NULL,
  "endLine" INTEGER NOT NULL,
  "tokenCount" INTEGER NOT NULL DEFAULT 0,
  "hash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CodeChunk_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CodeChunk_repositoryId_hash_key" ON "CodeChunk"("repositoryId", "hash");
CREATE INDEX "CodeChunk_repositoryId_idx" ON "CodeChunk"("repositoryId");
CREATE INDEX "CodeChunk_repositoryId_fileId_idx" ON "CodeChunk"("repositoryId", "fileId");
CREATE INDEX "CodeChunk_repositoryId_chunkType_idx" ON "CodeChunk"("repositoryId", "chunkType");
CREATE INDEX "CodeChunk_repositoryId_language_idx" ON "CodeChunk"("repositoryId", "language");

-- Embedding table (pgvector)
CREATE TABLE "Embedding" (
  "id" TEXT NOT NULL,
  "chunkId" TEXT NOT NULL,
  "vector" vector(384) NOT NULL,
  "model" TEXT NOT NULL DEFAULT 'ngram-rp',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Embedding_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Embedding_chunkId_key" UNIQUE ("chunkId"),
  CONSTRAINT "Embedding_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "CodeChunk"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- HNSW index for fast approximate nearest neighbor search
CREATE INDEX "Embedding_vector_idx" ON "Embedding" USING hnsw (vector vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- Conversation table
CREATE TABLE "Conversation" (
  "id" TEXT NOT NULL,
  "repositoryId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Conversation_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Conversation_repositoryId_userId_idx" ON "Conversation"("repositoryId", "userId");
CREATE INDEX "Conversation_userId_idx" ON "Conversation"("userId");

-- Message table
CREATE TABLE "Message" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "evidence" JSONB,
  "tokenCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Message_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- Foreign key from CodeChunk to RepoFile
ALTER TABLE "CodeChunk" ADD CONSTRAINT "CodeChunk_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "RepoFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign key from CodeChunk to Repository (already has it via schema, but explicit)
-- ALTER TABLE "CodeChunk" ADD CONSTRAINT "CodeChunk_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;
