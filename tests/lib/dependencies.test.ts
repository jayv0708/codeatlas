import { describe, expect, it } from "vitest";

import { resolveImport } from "@/lib/ingestion/dependencies";

const FILES = new Set([
  "src/index.ts",
  "src/lib/utils.ts",
  "src/lib/index.ts",
  "src/components/Button.tsx",
  "src/types.d.ts",
]);

describe("resolveImport", () => {
  it("resolves relative imports with explicit extension", () => {
    expect(resolveImport("src/index.ts", "./lib/utils.ts", FILES)).toBe("src/lib/utils.ts");
  });

  it("resolves relative imports without extension", () => {
    expect(resolveImport("src/index.ts", "./lib/utils", FILES)).toBe("src/lib/utils.ts");
    expect(resolveImport("src/index.ts", "./components/Button", FILES)).toBe(
      "src/components/Button.tsx",
    );
    expect(resolveImport("src/index.ts", "./types", FILES)).toBe("src/types.d.ts");
  });

  it("resolves directory imports to their index file", () => {
    expect(resolveImport("src/index.ts", "./lib", FILES)).toBe("src/lib/index.ts");
  });

  it("resolves parent-directory traversal", () => {
    expect(resolveImport("src/lib/utils.ts", "../index", FILES)).toBe("src/index.ts");
  });

  it("returns null for unresolvable and external specifiers", () => {
    expect(resolveImport("src/index.ts", "./missing", FILES)).toBeNull();
    expect(resolveImport("src/index.ts", "react", FILES)).toBeNull();
    expect(resolveImport("src/index.ts", "@/lib/utils", FILES)).toBeNull();
  });
});
