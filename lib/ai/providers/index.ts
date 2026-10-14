/**
 * CodeAtlas AI Provider Factory
 *
 * Returns the configured AI provider based on AI_PROVIDER env var.
 * Defaults to "gemini" if not specified.
 *
 * Supports:
 *   - gemini: Google Gemini API (requires GEMINI_API_KEY)
 *   - claude: Anthropic Claude API (requires ANTHROPIC_API_KEY)
 *   - ollama: Local Ollama instance (requires OLLAMA_BASE_URL)
 */

import type { AIProvider } from "./types";
import { ClaudeProvider } from "./claude";
import { OllamaProvider } from "./ollama";
import { GeminiProvider } from "./gemini";

let cachedProvider: AIProvider | null = null;

/**
 * Get the configured AI provider. Singleton — created once and reused.
 */
export function getAIProvider(): AIProvider {
  if (cachedProvider) return cachedProvider;

  const providerName = (process.env.AI_PROVIDER || "gemini").toLowerCase();

  switch (providerName) {
    case "claude":
      cachedProvider = new ClaudeProvider();
      break;
    case "ollama":
      cachedProvider = new OllamaProvider();
      break;
    case "gemini":
    default:
      cachedProvider = new GeminiProvider();
      break;
  }

  return cachedProvider;
}

/**
 * Reset the cached provider (useful for tests or runtime config changes).
 */
export function resetAIProvider(): void {
  cachedProvider = null;
}

export { ClaudeProvider } from "./claude";
export { OllamaProvider } from "./ollama";
export { GeminiProvider } from "./gemini";
export type { AIProvider } from "./types";
