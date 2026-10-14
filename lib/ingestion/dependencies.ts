/**
 * File-to-file dependency resolution for JavaScript/TypeScript.
 *
 * Resolves relative import specifiers (`./x`, `../x`) against the repository's
 * indexed file set, trying extensions and `index` files the way bundlers do.
 * Non-relative specifiers (npm packages, `@/` aliases, Java packages) are left
 * as external — they resolve to `null` and are stored as raw target strings.
 */

import path from "node:path";

const CANDIDATE_SUFFIXES = ["", ".ts", ".tsx", ".d.ts", ".js", ".jsx", ".mjs", ".cjs"];

function candidatesFor(base: string): string[] {
  const candidates: string[] = [];
  for (const suffix of CANDIDATE_SUFFIXES) {
    candidates.push(`${base}${suffix}`);
  }
  for (const suffix of CANDIDATE_SUFFIXES) {
    candidates.push(`${base}/index${suffix}`);
  }
  return candidates;
}

/**
 * Resolve `specifier` relative to the file at `filePath`.
 * Returns the matching repository path (no leading `./`) or `null` when the
 * import is external or cannot be resolved locally.
 */
export function resolveImport(
  filePath: string,
  specifier: string,
  availableFiles: Set<string>,
): string | null {
  if (!specifier.startsWith(".")) return null;

  const dir = path.posix.dirname(filePath);
  const base = path.posix.normalize(path.posix.join(dir, specifier));

  for (const candidate of candidatesFor(base)) {
    if (availableFiles.has(candidate)) return candidate;
  }
  return null;
}
