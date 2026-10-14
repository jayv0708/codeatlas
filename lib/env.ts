/**
 * Centralized, validated environment variables.
 *
 * Import this module (not process.env) anywhere you need env access.
 * On first import the module validates required variables and throws
 * a clear error if any are missing. Optional variables fall back to
 * sensible defaults.
 */

function required(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        "Add it to .env.local (see .env.example for reference).",
    );
  }
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

export const env = {
  // ── Database ──────────────────────────────────────────────────────────────
  DATABASE_URL: required("DATABASE_URL"),

  // ── Auth ──────────────────────────────────────────────────────────────────
  AUTH_SECRET: required("AUTH_SECRET"),
  GITHUB_CLIENT_ID: optional("GITHUB_CLIENT_ID", ""),
  GITHUB_CLIENT_SECRET: optional("GITHUB_CLIENT_SECRET", ""),

  // ── AI Provider ───────────────────────────────────────────────────────────
  AI_PROVIDER: optional("AI_PROVIDER", "gemini") as "claude" | "ollama" | "gemini",
  GEMINI_API_KEY: optional("GEMINI_API_KEY", ""),
  GEMINI_MODEL: optional("GEMINI_MODEL", "gemini-2.5-flash"),
  ANTHROPIC_API_KEY: optional("ANTHROPIC_API_KEY", ""),
  CLAUDE_MODEL: optional("CLAUDE_MODEL", "claude-sonnet-4-20250514"),
  OLLAMA_BASE_URL: optional("OLLAMA_BASE_URL", "http://localhost:11434"),
  OLLAMA_CHAT_MODEL: optional("OLLAMA_CHAT_MODEL", "llama3.1"),
  OLLAMA_EMBEDDING_MODEL: optional("OLLAMA_EMBEDDING_MODEL", "nomic-embed-text"),

  // ── Email (SMTP) ─────────────────────────────────────────────────────────
  SMTP_HOST: optional("SMTP_HOST", ""),
  SMTP_PORT: optional("SMTP_PORT", ""),
  SMTP_USER: optional("SMTP_USER", ""),
  SMTP_PASSWORD: optional("SMTP_PASSWORD", ""),
  EMAIL_FROM: optional("EMAIL_FROM", "CodeAtlas <noreply@codeatlas.dev>"),

  // ── App ───────────────────────────────────────────────────────────────────
  NEXTAUTH_URL: optional("NEXTAUTH_URL", "http://localhost:3000"),
  NODE_ENV: optional("NODE_ENV", "development"),
} as const;

/**
 * Check whether the AI backend is configured.
 * Returns an object with `ok` and a reason if not.
 */
export function checkAIConfig(): { ok: true } | { ok: false; reason: string } {
  if (env.AI_PROVIDER === "claude" && !env.ANTHROPIC_API_KEY) {
    return { ok: false, reason: "ANTHROPIC_API_KEY is not set." };
  }
  if (env.AI_PROVIDER === "gemini" && !env.GEMINI_API_KEY) {
    return { ok: false, reason: "GEMINI_API_KEY is not set." };
  }
  return { ok: true };
}
