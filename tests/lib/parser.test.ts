import { describe, expect, it } from "vitest";

import { detectLanguageFromPath, parseSource } from "@/lib/ingestion/parser";

describe("detectLanguageFromPath", () => {
  it("detects supported languages from the file extension", () => {
    expect(detectLanguageFromPath("src/index.ts")).toBe("TypeScript");
    expect(detectLanguageFromPath("src/App.tsx")).toBe("TypeScript");
    expect(detectLanguageFromPath("src/index.js")).toBe("JavaScript");
    expect(detectLanguageFromPath("src/App.jsx")).toBe("JavaScript");
    expect(detectLanguageFromPath("src/cli.mjs")).toBe("JavaScript");
    expect(detectLanguageFromPath("src/cli.cjs")).toBe("JavaScript");
    expect(detectLanguageFromPath("src/Main.java")).toBe("Java");
  });

  it("returns null for unsupported files", () => {
    expect(detectLanguageFromPath("README.md")).toBeNull();
    expect(detectLanguageFromPath("src/logo.png")).toBeNull();
    expect(detectLanguageFromPath("src/data.json")).toBeNull();
  });
});

describe("parseSource — TypeScript/JavaScript", () => {
  const source = [
    'import { foo } from "./foo";',
    'import bar from "../lib/bar";',
    'import "side-effect";',
    'const baz = require("./baz");',
    'export { helper } from "./helper";',
    "",
    "export class UserService {",
    "  private repo: UserRepo;",
    "  constructor(repo: UserRepo) { this.repo = repo; }",
    "  async findById(id: string): Promise<User | null> {",
    "    return this.repo.find(id);",
    "  }",
    "}",
    "",
    "export interface User { id: string }",
    "",
    "export type UserId = string;",
    "",
    "export function helper() {}",
    "export const makeUser = (name: string) => ({ name });",
  ].join("\n");

  const result = parseSource("src/user-service.ts", source);

  it("extracts import specifiers with their kinds", () => {
    expect(result.imports).toEqual([
      { specifier: "./foo", kind: "import" },
      { specifier: "../lib/bar", kind: "import" },
      { specifier: "side-effect", kind: "import" },
      { specifier: "./baz", kind: "require" },
      { specifier: "./helper", kind: "export" },
    ]);
  });

  it("extracts classes with method symbols and correct line numbers", () => {
    const userService = result.symbols.find((s) => s.name === "UserService");
    expect(userService?.type).toBe("class");
    expect(userService?.startLine).toBe(7);
    expect(userService?.endLine).toBe(13);

    const constructor = result.symbols.find((s) => s.name === "constructor");
    expect(constructor?.type).toBe("method");
    expect(constructor?.startLine).toBe(9);

    const findById = result.symbols.find((s) => s.name === "findById");
    expect(findById?.type).toBe("method");
    expect(findById?.startLine).toBe(10);
    expect(findById?.endLine).toBe(12);
  });

  it("extracts interfaces, type aliases, functions, and exports", () => {
    const types = result.symbols.map((s) => `${s.type}:${s.name}`);
    expect(types).toContain("interface:User");
    expect(types).toContain("type:UserId");
    expect(types).toContain("function:helper");
    expect(types).toContain("function:makeUser");
    expect(types).toContain("export:helper");
  });

  it("handles a single-line class body", () => {
    const result = parseSource("a.ts", "export class Empty {}");
    expect(result.symbols).toContainEqual(
      expect.objectContaining({ name: "Empty", type: "class", startLine: 1, endLine: 1 }),
    );
  });

  it("ignores control-flow keywords as methods", () => {
    const result = parseSource(
      "a.ts",
      [
        "export class Runner {",
        "  run() {",
        "    if (ok) {",
        "      return;",
        "    }",
        "    for (let i = 0; i < 3; i++) {}",
        "    while (x) {}",
        "  }",
        "}",
      ].join("\n"),
    );
    const methodNames = result.symbols.filter((s) => s.type === "method").map((s) => s.name);
    expect(methodNames).toEqual(["run"]);
  });
});

describe("parseSource — Java", () => {
  const source = [
    "package com.example.users;",
    "",
    "import java.util.List;",
    "import com.example.core.User;",
    "",
    "public class UserService {",
    "    private final UserRepo repo;",
    "",
    "    public UserService(UserRepo repo) {",
    "        this.repo = repo;",
    "    }",
    "",
    "    public User findById(String id) {",
    "        for (int i = 0; i < 10; i++) {",
    "            System.out.println(i);",
    "        }",
    "        return this.repo.find(id);",
    "    }",
    "",
    "    private void helper() { }",
    "}",
  ].join("\n");

  const result = parseSource("src/main/java/com/example/users/UserService.java", source);

  it("extracts Java imports", () => {
    expect(result.imports).toEqual([
      { specifier: "java.util.List", kind: "import" },
      { specifier: "com.example.core.User", kind: "import" },
    ]);
  });

  it("extracts the class and its methods (excluding control flow)", () => {
    expect(result.symbols).toContainEqual(
      expect.objectContaining({ name: "UserService", type: "class", startLine: 6 }),
    );
    const methodNames = result.symbols.filter((s) => s.type === "method").map((s) => s.name);
    expect(methodNames).toContain("UserService"); // constructor
    expect(methodNames).toContain("findById");
    expect(methodNames).toContain("helper");
    expect(methodNames).not.toContain("for");
    expect(methodNames).not.toContain("println");
  });
});
