/**
 * Ollama AI Provider
 *
 * Connects to a local Ollama instance for chat completions and optionally
 * embeddings. Supports streaming via the Ollama API.
 *
 * Environment variables:
 *   OLLAMA_BASE_URL     — e.g. http://localhost:11434 (default)
 *   OLLAMA_CHAT_MODEL   — e.g. llama3.1 (default)
 *   OLLAMA_EMBEDDING_MODEL — e.g. nomic-embed-text (optional, for local embeddings)
 */

import type {
  AIProvider,
  AgentCompletionRequest,
  AgentCompletionResponse,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ContentBlock,
  EmbeddingRequest,
  EmbeddingResponse,
  StreamCallbacks,
} from "./types";

const DEFAULT_BASE_URL = "http://localhost:11434";
const DEFAULT_CHAT_MODEL = "llama3.1";
const DEFAULT_EMBEDDING_MODEL = "nomic-embed-text";

export class OllamaProvider implements AIProvider {
  readonly name = "ollama";
  private baseUrl: string;
  private chatModel: string;
  private embeddingModel: string;

  constructor() {
    this.baseUrl = (process.env.OLLAMA_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
    this.chatModel = process.env.OLLAMA_CHAT_MODEL || DEFAULT_CHAT_MODEL;
    this.embeddingModel = process.env.OLLAMA_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Check if the specific model is pulled/available on the Ollama server.
   */
  async isModelAvailable(model?: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`);
      if (!res.ok) return false;
      const data = (await res.json()) as { models?: Array<{ name: string }> };
      const modelName = model ?? this.chatModel;
      return data.models?.some((m) => m.name === modelName || m.name.startsWith(modelName + ":")) ?? false;
    } catch {
      return false;
    }
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const model = request.model || this.chatModel;

    const messages: Array<{ role: string; content: string }> = [];
    if (request.system) {
      messages.push({ role: "system", content: request.system });
    }
    for (const m of request.messages) {
      messages.push({ role: m.role, content: m.content });
    }

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: {
          num_predict: request.maxTokens ?? 2048,
          temperature: request.temperature,
        },
      }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "unknown");
      throw new Error(`Ollama chat failed (HTTP ${res.status}): ${errorText}`);
    }

    const data = (await res.json()) as {
      message?: { content?: string };
      prompt_eval_count?: number;
      eval_count?: number;
    };

    return {
      content: data.message?.content ?? "No response generated.",
      usage: {
        input: data.prompt_eval_count ?? 0,
        output: data.eval_count ?? 0,
      },
    };
  }

  async chatStream(
    request: ChatCompletionRequest,
    callbacks: StreamCallbacks,
  ): Promise<void> {
    const model = request.model || this.chatModel;

    const messages: Array<{ role: string; content: string }> = [];
    if (request.system) {
      messages.push({ role: "system", content: request.system });
    }
    for (const m of request.messages) {
      messages.push({ role: m.role, content: m.content });
    }

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        options: {
          num_predict: request.maxTokens ?? 2048,
          temperature: request.temperature,
        },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "unknown");
      callbacks.onError(new Error(`Ollama stream failed (HTTP ${res.status}): ${errorText}`));
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      callbacks.onError(new Error("No response body from Ollama"));
      return;
    }

    const decoder = new TextDecoder();
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          try {
            const json = JSON.parse(line) as {
              message?: { content?: string };
              prompt_eval_count?: number;
              eval_count?: number;
              done?: boolean;
            };

            if (json.message?.content) {
              callbacks.onChunk(json.message.content);
            }
            if (json.prompt_eval_count) inputTokens = json.prompt_eval_count;
            if (json.eval_count) outputTokens = json.eval_count;

            if (json.done) {
              callbacks.onDone({ input: inputTokens, output: outputTokens });
            }
          } catch {
            // Skip malformed lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async agentChat(
    request: AgentCompletionRequest,
  ): Promise<AgentCompletionResponse> {
    // Ollama supports tool calling in newer models (llama3.1+)
    const model = request.model || this.chatModel;

    const messages: Array<{ role: string; content: string }> = [];
    if (request.system) {
      messages.push({ role: "system", content: request.system });
    }
    for (const m of request.messages) {
      messages.push({ role: m.role, content: m.content });
    }

    // Build tools in Ollama format
    const tools = request.tools?.map((t) => ({
      type: "function" as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.input_schema,
      },
    }));

    const body: Record<string, unknown> = {
      model,
      messages,
      stream: false,
      options: {
        num_predict: request.maxTokens ?? 2048,
      },
    };
    if (tools && tools.length > 0) {
      body.tools = tools;
    }

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "unknown");
      throw new Error(`Ollama agent chat failed (HTTP ${res.status}): ${errorText}`);
    }

    const data = (await res.json()) as {
      message?: {
        content?: string;
        tool_calls?: Array<{
          function: { name: string; arguments: Record<string, unknown> };
        }>;
      };
      prompt_eval_count?: number;
      eval_count?: number;
    };

    const content: ContentBlock[] = [];

    // Parse tool calls from Ollama response
    if (data.message?.tool_calls && data.message.tool_calls.length > 0) {
      for (const tc of data.message.tool_calls) {
        content.push({
          type: "tool_use",
          id: `ollama_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          name: tc.function.name,
          input: tc.function.arguments,
        });
      }
    }

    // Always include text content if present
    if (data.message?.content) {
      content.push({ type: "text", text: data.message.content });
    }

    // Ensure at least one text block
    if (content.length === 0) {
      content.push({ type: "text", text: "No response generated." });
    }

    return {
      content,
      usage: {
        input: data.prompt_eval_count ?? 0,
        output: data.eval_count ?? 0,
      },
    };
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const model = request.model || this.embeddingModel;

    const res = await fetch(`${this.baseUrl}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        input: request.input,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "unknown");
      throw new Error(`Ollama embedding failed (HTTP ${res.status}): ${errorText}`);
    }

    const data = (await res.json()) as { embeddings?: number[][] };

    if (!data.embeddings || data.embeddings.length === 0) {
      throw new Error("Ollama returned no embeddings");
    }

    return {
      embedding: data.embeddings[0],
      model,
    };
  }
}
