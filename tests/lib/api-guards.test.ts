import { describe, expect, it } from "vitest";

// Pure input validators - no external dependencies
function validateId(value: unknown): string {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(value)) {
    throw new Error("Invalid identifier.");
  }
  return value;
}

function validateMessage(body: unknown): { message: string } {
  if (!body || typeof body !== "object") {
    throw new Error("Request body is required.");
  }
  const { message } = body as Record<string, unknown>;
  if (typeof message !== "string" || message.trim().length === 0) {
    throw new Error("Message is required.");
  }
  if (message.length > 10_000) {
    throw new Error("Message must be under 10,000 characters.");
  }
  return { message: message.trim() };
}

function validateFullName(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("Repository name is required.");
  }
  const trimmed = value.trim();
  if (!/^[\w.-]+\/[\w.-]+$/.test(trimmed) || trimmed.length > 100) {
    throw new Error("Invalid repository identifier (expected owner/name).");
  }
  return trimmed;
}

describe("validateId", () => {
  it("accepts valid IDs", () => {
    expect(validateId("abc123")).toBe("abc123");
    expect(validateId("repo-name_1")).toBe("repo-name_1");
    expect(validateId("a")).toBe("a");
  });

  it("rejects invalid IDs", () => {
    expect(() => validateId("")).toThrow();
    expect(() => validateId(null)).toThrow();
    expect(() => validateId(undefined)).toThrow();
    expect(() => validateId("id with spaces")).toThrow();
    expect(() => validateId("id/with/slashes")).toThrow();
    expect(() => validateId("a".repeat(129))).toThrow();
  });
});

describe("validateMessage", () => {
  it("accepts valid messages", () => {
    expect(validateMessage({ message: "Hello" })).toEqual({ message: "Hello" });
    expect(validateMessage({ message: "  trimmed  " })).toEqual({ message: "trimmed" });
  });

  it("rejects empty or missing messages", () => {
    expect(() => validateMessage(null)).toThrow();
    expect(() => validateMessage({})).toThrow();
    expect(() => validateMessage({ message: "" })).toThrow();
    expect(() => validateMessage({ message: "   " })).toThrow();
  });

  it("rejects messages that are too long", () => {
    const longMessage = "x".repeat(10_001);
    expect(() => validateMessage({ message: longMessage })).toThrow();
  });

  it("accepts messages at the limit", () => {
    const maxMessage = "x".repeat(10_000);
    expect(validateMessage({ message: maxMessage })).toEqual({ message: maxMessage });
  });
});

describe("validateFullName", () => {
  it("accepts valid owner/name", () => {
    expect(validateFullName("facebook/react")).toBe("facebook/react");
    expect(validateFullName("user-name/my.repo_v2")).toBe("user-name/my.repo_v2");
  });

  it("trims whitespace", () => {
    expect(validateFullName("  facebook/react  ")).toBe("facebook/react");
  });

  it("rejects invalid formats", () => {
    expect(() => validateFullName("")).toThrow();
    expect(() => validateFullName(null)).toThrow();
    expect(() => validateFullName("no-slash")).toThrow();
    expect(() => validateFullName("a/".repeat(60))).toThrow(); // too long
  });
});
