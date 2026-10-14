/**
 * Repository file filtering for ingestion.
 *
 * Kept intentionally simple: path-segment ignore list + an explicit source
 * extension allowlist (binaries and unknown files are never fetched). This
 * covers the Phase 3 languages (TypeScript / JavaScript / Java); adding a
 * language is a one-line extension to `INDEXABLE_EXTENSIONS`.
 */

export const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "out",
  ".next",
  "coverage",
  "vendor",
  "target", // Java/Maven build output
  ".gradle",
  ".cache",
  ".turbo",
  ".vercel",
  ".venv",
  "venv",
  "__pycache__",
  ".idea",
  ".vscode",
]);

export const INDEXABLE_EXTENSIONS = new Set(["ts", "tsx", "js", "jsx", "mjs", "cjs", "java"]);

/** Files larger than this (bytes) are skipped entirely (large binaries/noise). */
export const MAX_FILE_SIZE_BYTES = 512 * 1024;

/** Hard cap on the number of files indexed per repository (safety valve). */
export const MAX_FILES_PER_REPOSITORY = 10_000;

export function getExtension(path: string): string | null {
  const lastSlash = path.lastIndexOf("/");
  const fileName = lastSlash === -1 ? path : path.slice(lastSlash + 1);
  const dot = fileName.lastIndexOf(".");
  if (dot <= 0 || dot === fileName.length - 1) return null;
  return fileName.slice(dot + 1).toLowerCase();
}

/**
 * Decides whether a file at `path` (with `size` bytes) should be ingested.
 */
export function isIndexableFile(path: string, size: number): boolean {
  if (size > MAX_FILE_SIZE_BYTES) return false;
  const segments = path.split("/");
  for (const segment of segments) {
    if (IGNORED_DIRECTORIES.has(segment)) return false;
  }
  const ext = getExtension(path);
  return ext !== null && INDEXABLE_EXTENSIONS.has(ext);
}
