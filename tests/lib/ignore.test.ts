import { describe, expect, it } from "vitest";

import { MAX_FILE_SIZE_BYTES, getExtension, isIndexableFile } from "@/lib/ingestion/ignore";

describe("getExtension", () => {
  it("returns the lowercase extension", () => {
    expect(getExtension("src/App.TSX")).toBe("tsx");
    expect(getExtension("src/index.ts")).toBe("ts");
    expect(getExtension("src/a.d.ts")).toBe("ts");
  });

  it("returns null for dotfiles and extensionless files", () => {
    expect(getExtension("src/.gitignore")).toBeNull();
    expect(getExtension("README")).toBeNull();
  });
});

describe("isIndexableFile", () => {
  it("indexes supported source files", () => {
    expect(isIndexableFile("src/index.ts", 100)).toBe(true);
    expect(isIndexableFile("src/App.tsx", 100)).toBe(true);
    expect(isIndexableFile("src/index.js", 100)).toBe(true);
    expect(isIndexableFile("src/Main.java", 100)).toBe(true);
    expect(isIndexableFile("src/cli.mjs", 100)).toBe(true);
  });

  it("ignores build, dependency, and generated directories", () => {
    expect(isIndexableFile("node_modules/foo/index.js", 100)).toBe(false);
    expect(isIndexableFile("src/.git/config", 100)).toBe(false);
    expect(isIndexableFile("dist/main.js", 100)).toBe(false);
    expect(isIndexableFile("build/bundle.js", 100)).toBe(false);
    expect(isIndexableFile(".next/chunk.js", 100)).toBe(false);
    expect(isIndexableFile("coverage/lcov.js", 100)).toBe(false);
    expect(isIndexableFile("vendor/lib.js", 100)).toBe(false);
    expect(isIndexableFile("target/classes/Foo.java", 100)).toBe(false);
  });

  it("skips non-source files and binaries", () => {
    expect(isIndexableFile("src/logo.png", 100)).toBe(false);
    expect(isIndexableFile("README.md", 100)).toBe(false);
    expect(isIndexableFile("package-lock.json", 100)).toBe(false);
    expect(isIndexableFile("src/app.wasm", 100)).toBe(false);
  });

  it("skips files over the size cap", () => {
    expect(isIndexableFile("src/huge.ts", MAX_FILE_SIZE_BYTES + 1)).toBe(false);
  });
});
