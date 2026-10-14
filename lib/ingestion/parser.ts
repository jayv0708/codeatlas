/**
 * Lightweight source parser for Phase 3.
 *
 * Line-based (regex) extraction of basic structure: classes, functions,
 * methods, interfaces, types, imports, and exports. This is intentionally
 * NOT a full language grammar — it targets the common declaration forms and
 * skips exotic ones. Known limitations (acceptable for the MVP):
 *  - no awareness of strings/comments inside brace matching
 *  - method detection is indentation-agnostic but keyword-guarded
 * Design note: `parseSource(path, content)` is the single entry point, so a
 * new language only needs a new branch + `detectLanguageFromPath` entry.
 */

import { getExtension } from "@/lib/ingestion/ignore";

export type SymbolType =
  "class" | "function" | "method" | "interface" | "type" | "import" | "export";

export interface ParsedSymbol {
  name: string;
  type: SymbolType;
  startLine: number;
  endLine: number;
}

export interface ParsedImport {
  specifier: string;
  kind: "import" | "require" | "export";
}

export interface ParseResult {
  language: string | null;
  symbols: ParsedSymbol[];
  imports: ParsedImport[];
}

const TS_EXTENSIONS = new Set(["ts", "tsx"]);
const JS_EXTENSIONS = new Set(["js", "jsx", "mjs", "cjs"]);

export function detectLanguageFromPath(path: string): string | null {
  const ext = getExtension(path);
  if (!ext) return null;
  if (TS_EXTENSIONS.has(ext)) return "TypeScript";
  if (JS_EXTENSIONS.has(ext)) return "JavaScript";
  if (ext === "java") return "Java";
  return null;
}

/** Net `{`/`}` balance of a line (crude; ignores strings/comments). */
function braceDelta(line: string): number {
  let delta = 0;
  for (const ch of line) {
    if (ch === "{") delta += 1;
    else if (ch === "}") delta -= 1;
  }
  return delta;
}

/** Index of the line that closes the block opened at `start` (inclusive). */
function findBlockEnd(lines: string[], start: number): number {
  let depth = 0;
  for (let i = start; i < lines.length; i++) {
    depth += braceDelta(lines[i]);
    if (depth <= 0) return i;
  }
  return lines.length - 1;
}

const TS_METHOD_KEYWORDS = new Set([
  "if",
  "for",
  "while",
  "switch",
  "catch",
  "return",
  "new",
  "throw",
  "do",
  "else",
  "case",
  "in",
  "of",
  "typeof",
  "instanceof",
  "void",
  "await",
  "yield",
  "extends",
  "delete",
]);

// `[^{]*` after `)` allows return-type annotations (`): Promise<X> {`).
const TS_METHOD_RE =
  /^\s+(?:(?:public|private|protected|static|async|get|set|readonly|override)\s+)*([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*[^{]*\{/;

function parseTsLike(content: string): Omit<ParseResult, "language"> {
  const lines = content.split(/\r?\n/);
  const symbols: ParsedSymbol[] = [];
  const imports: ParsedImport[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // ── imports / re-exports ────────────────────────────────────────────
    const namedImport = line.match(
      /^\s*import\s+(?:type\s+)?[\w$*{},\s]+\s+from\s+['"]([^'"]+)['"]/,
    );
    const sideEffectImport = line.match(/^\s*import\s+['"]([^'"]+)['"]/);
    const dynamicImport = line.match(/^\s*import\s*\(\s*['"]([^'"]+)['"]\s*\)/);
    const requireCall = line.match(
      /(?:^|[;}\n])\s*(?:const\s+\w+\s*=\s*)?require\s*\(\s*['"]([^'"]+)['"]\s*\)/,
    );
    const reExport = line.match(/^\s*export\s+.*?\s+from\s+['"]([^'"]+)['"]/);

    const specifier =
      namedImport?.[1] ??
      sideEffectImport?.[1] ??
      dynamicImport?.[1] ??
      requireCall?.[1] ??
      reExport?.[1];
    if (specifier) {
      imports.push({
        specifier,
        kind: requireCall ? "require" : reExport ? "export" : "import",
      });
    }

    // ── classes ──────────────────────────────────────────────────────────
    const classMatch = line.match(
      /^\s*(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/,
    );
    if (classMatch) {
      const endLine = findBlockEnd(lines, i);
      symbols.push({ name: classMatch[1], type: "class", startLine: i + 1, endLine: endLine + 1 });

      // methods within the class body
      for (let j = i + 1; j <= endLine; j++) {
        const method = lines[j].match(TS_METHOD_RE);
        if (method && !TS_METHOD_KEYWORDS.has(method[1])) {
          const methodEnd = findBlockEnd(lines, j);
          symbols.push({
            name: method[1],
            type: "method",
            startLine: j + 1,
            endLine: Math.min(methodEnd, endLine) + 1,
          });
        }
      }
      continue;
    }

    // ── interfaces / type aliases / functions / arrow consts / exports ──
    const interfaceMatch = line.match(/^\s*(?:export\s+)?interface\s+([A-Za-z_$][\w$]*)/);
    if (interfaceMatch) {
      symbols.push({
        name: interfaceMatch[1],
        type: "interface",
        startLine: i + 1,
        endLine: findBlockEnd(lines, i) + 1,
      });
      continue;
    }

    const typeMatch = line.match(/^\s*(?:export\s+)?type\s+([A-Za-z_$][\w$]*)\s*=/);
    if (typeMatch) {
      symbols.push({ name: typeMatch[1], type: "type", startLine: i + 1, endLine: i + 1 });
      continue;
    }

    const functionMatch = line.match(
      /^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/,
    );
    if (functionMatch) {
      symbols.push({
        name: functionMatch[1],
        type: "function",
        startLine: i + 1,
        endLine: findBlockEnd(lines, i) + 1,
      });
      continue;
    }

    const arrowMatch = line.match(
      /^\s*(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/,
    );
    if (arrowMatch) {
      symbols.push({
        name: arrowMatch[1],
        type: "function",
        startLine: i + 1,
        endLine: findBlockEnd(lines, i) + 1,
      });
      continue;
    }

    const exportList = line.match(/^\s*export\s*\{([^}]+)\}/);
    if (exportList) {
      for (const member of exportList[1].split(",")) {
        const name = member
          .trim()
          .split(/\s+as\s+/)[0]
          ?.trim();
        if (name && /^[A-Za-z_$][\w$]*$/.test(name)) {
          symbols.push({ name, type: "export", startLine: i + 1, endLine: i + 1 });
        }
      }
    }
  }

  return { symbols, imports };
}

const JAVA_KEYWORDS = new Set([
  "if",
  "for",
  "while",
  "switch",
  "catch",
  "return",
  "new",
  "throw",
  "do",
  "else",
  "case",
  "class",
  "interface",
  "enum",
  "record",
  "extends",
  "implements",
  "package",
  "import",
  "static",
  "final",
  "public",
  "private",
  "protected",
  "synchronized",
  "abstract",
  "instanceof",
]);

// `[^{]*` after `)` allows `throws` clauses; `void` is intentionally NOT a
// keyword here because it is a return type, not a control-flow token.
const JAVA_METHOD_RE =
  /^\s+((?:(?:public|private|protected|static|final|synchronized|abstract|native|default)\s+)*)(?:([\w<>,.?\[\]]+)\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*[^{]*\{/;

function parseJava(content: string): Omit<ParseResult, "language"> {
  const lines = content.split(/\r?\n/);
  const symbols: ParsedSymbol[] = [];
  const imports: ParsedImport[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const importMatch = line.match(/^\s*import\s+(?:static\s+)?([\w.*]+);/);
    if (importMatch) {
      imports.push({ specifier: importMatch[1], kind: "import" });
      continue;
    }

    const typeMatch = line.match(
      /^\s*(?:public\s+|final\s+|abstract\s+|sealed\s+|non-sealed\s+)*(class|interface|enum|record)\s+(\w+)/,
    );
    if (typeMatch) {
      const kind: SymbolType =
        typeMatch[1] === "class" ? "class" : typeMatch[1] === "interface" ? "interface" : "class";
      const endLine = findBlockEnd(lines, i);
      symbols.push({ name: typeMatch[2], type: kind, startLine: i + 1, endLine: endLine + 1 });

      for (let j = i + 1; j <= endLine; j++) {
        const method = lines[j].match(JAVA_METHOD_RE);
        if (!method) continue;
        const precedingToken = method[2];
        const name = method[3];
        if (JAVA_KEYWORDS.has(name)) continue;
        if (precedingToken && JAVA_KEYWORDS.has(precedingToken)) continue;
        const methodEnd = findBlockEnd(lines, j);
        symbols.push({
          name,
          type: "method",
          startLine: j + 1,
          endLine: Math.min(methodEnd, endLine) + 1,
        });
      }
      continue;
    }

    const enumMatch = line.match(/^\s*(?:public\s+)?enum\s+(\w+)/);
    if (enumMatch) {
      symbols.push({
        name: enumMatch[1],
        type: "class",
        startLine: i + 1,
        endLine: findBlockEnd(lines, i) + 1,
      });
    }
  }

  return { symbols, imports };
}

/**
 * Parse source content into symbols and imports.
 * Returns `language: null` for unsupported files.
 */
export function parseSource(path: string, content: string): ParseResult {
  const language = detectLanguageFromPath(path);
  if (!language) {
    return { language: null, symbols: [], imports: [] };
  }
  const parsed = language === "Java" ? parseJava(content) : parseTsLike(content);
  return { language, ...parsed };
}
