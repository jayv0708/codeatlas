-- Phase 3 — repository connection + ingestion
-- Extend Repository with ingestion metadata and add files/symbols/dependencies/jobs.

-- AlterTable
DROP INDEX "Repository_fullName_key";
ALTER TABLE "Repository"
    ADD COLUMN "language" TEXT,
    ADD COLUMN "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "progress" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "lastError" TEXT,
    ADD COLUMN "indexedAt" TIMESTAMP(3);

-- A repository can be connected once per user (fullName is nullable; Postgres
-- treats NULLs as distinct in unique indexes).
CREATE UNIQUE INDEX "Repository_userId_fullName_key" ON "Repository"("userId", "fullName");

-- CreateTable
CREATE TABLE "RepoFile" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "language" TEXT,
    "content" TEXT,
    "size" INTEGER NOT NULL DEFAULT 0,
    "sha" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepoFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RepoFile_repositoryId_path_key" ON "RepoFile"("repositoryId", "path");
CREATE INDEX "RepoFile_repositoryId_language_idx" ON "RepoFile"("repositoryId", "language");

-- AddForeignKey
ALTER TABLE "RepoFile" ADD CONSTRAINT "RepoFile_repositoryId_fkey"
    FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "Symbol" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startLine" INTEGER NOT NULL,
    "endLine" INTEGER NOT NULL,

    CONSTRAINT "Symbol_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Symbol_repositoryId_fileId_idx" ON "Symbol"("repositoryId", "fileId");
CREATE INDEX "Symbol_repositoryId_type_idx" ON "Symbol"("repositoryId", "type");
CREATE INDEX "Symbol_repositoryId_name_idx" ON "Symbol"("repositoryId", "name");

-- AddForeignKey
ALTER TABLE "Symbol" ADD CONSTRAINT "Symbol_repositoryId_fkey"
    FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Symbol" ADD CONSTRAINT "Symbol_fileId_fkey"
    FOREIGN KEY ("fileId") REFERENCES "RepoFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "Dependency" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "sourcePath" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "targetPath" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'import',

    CONSTRAINT "Dependency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Dependency_repositoryId_idx" ON "Dependency"("repositoryId");
CREATE INDEX "Dependency_repositoryId_fileId_idx" ON "Dependency"("repositoryId", "fileId");

-- AddForeignKey
ALTER TABLE "Dependency" ADD CONSTRAINT "Dependency_repositoryId_fkey"
    FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Dependency" ADD CONSTRAINT "Dependency_fileId_fkey"
    FOREIGN KEY ("fileId") REFERENCES "RepoFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "IngestionJob" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "stage" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "filesProcessed" INTEGER NOT NULL DEFAULT 0,
    "totalFiles" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngestionJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IngestionJob_repositoryId_status_idx" ON "IngestionJob"("repositoryId", "status");

-- AddForeignKey
ALTER TABLE "IngestionJob" ADD CONSTRAINT "IngestionJob_repositoryId_fkey"
    FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;
