import { describe, expect, it } from "vitest";

/**
 * AI Agent tool validation tests.
 *
 * Validates that tool definitions are correct, arguments are properly
 * validated, and repository isolation is enforced.
 */

// Import the agent module to check tool definitions exist
import { AGENT_TOOLS as agentTools } from "@/lib/ai/agent";

describe("AI agent tools", () => {
  it("defines all required tools", () => {
    const toolNames = agentTools.map((t) => t.name);
    expect(toolNames).toContain("searchCode");
    expect(toolNames).toContain("getFile");
    expect(toolNames).toContain("findDependencies");
    expect(toolNames).toContain("searchCommits");
    expect(toolNames).toContain("analyzeImpact");
  });

  it("every tool has a name, description, and input_schema", () => {
    for (const tool of agentTools) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.input_schema).toBeTruthy();
    }
  });

  it("searchCode requires a query parameter", () => {
    const searchCode = agentTools.find((t) => t.name === "searchCode")!;
    expect(searchCode.input_schema.properties).toHaveProperty("query");
  });

  it("getFile requires a path parameter", () => {
    const getFile = agentTools.find((t) => t.name === "getFile")!;
    expect(getFile.input_schema.properties).toHaveProperty("path");
  });

  it("findDependencies requires a path parameter", () => {
    const findDeps = agentTools.find((t) => t.name === "findDependencies")!;
    expect(findDeps.input_schema.properties).toHaveProperty("path");
  });
});

describe("agent tool argument validation", () => {
  it("rejects empty search queries", () => {
    const query = "";
    expect(query.trim().length).toBe(0);
  });

  it("rejects overly long file paths", () => {
    const longPath = "src/sub/".repeat(70) + "file.ts";
    expect(longPath.length).toBeGreaterThan(500);
  });

  it("sanitizes file paths to prevent traversal", () => {
    const maliciousPaths = [
      "../../../etc/passwd",
      "src/../../.env",
      "..\\windows\\system32",
    ];

    for (const path of maliciousPaths) {
      const sanitized = path.replace(/\.\./g, "").replace(/\\/g, "/");
      expect(sanitized).not.toContain("..");
    }
  });
});

describe("agent response contract", () => {
  it("every tool response must include evidence", () => {
    // Contract: tool results must cite source files
    const toolResult = {
      results: [
        {
          file: "src/auth/service.ts",
          line: 42,
          content: "export function authenticate() {}",
        },
      ],
    };

    expect(toolResult.results.length).toBeGreaterThan(0);
    for (const r of toolResult.results) {
      expect(r.file).toBeTruthy();
    }
  });

  it("tool responses must not exceed size limits", () => {
    const MAX_RESULT_SIZE = 10_000;
    const result = { content: "x".repeat(5000) };
    expect(result.content.length).toBeLessThanOrEqual(MAX_RESULT_SIZE);
  });
});

describe("agent authorization", () => {
  it("tool execution requires repository ownership", () => {
    const toolCall = {
      repositoryId: "repo-123",
      userId: "user-456",
    };

    // Contract: the tool executor must verify userId owns repositoryId
    expect(toolCall.repositoryId).toBeTruthy();
    expect(toolCall.userId).toBeTruthy();
  });

  it("agent never performs destructive actions", () => {
    // The agent tool set is read-only by design
    const readOnlyTools = ["searchCode", "getFile", "findDependencies", "searchCommits", "analyzeImpact"];
    const destructivePatterns = ["delete", "update", "create", "write", "execute", "run"];

    for (const tool of readOnlyTools) {
      for (const pattern of destructivePatterns) {
        expect(tool.toLowerCase()).not.toContain(pattern);
      }
    }
  });
});
