/**
 * CodeAtlas AI Provider Abstraction
 *
 * Defines the common interface for LLM providers (Claude, Ollama).
 * Both providers support chat completions and streaming. Embedding
 * support is optional (Claude doesn't need it; Ollama can provide embeddings).
 */

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatCompletionRequest {
  model?: string;
  messages: ChatMessage[];
  system?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ChatCompletionResponse {
  content: string;
  usage: {
    input: number;
    output: number;
  };
}

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onDone: (usage: { input: number; output: number }) => void;
  onError: (error: Error) => void;
}

export interface EmbeddingRequest {
  model?: string;
  input: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
}

/**
 * Tool definition for agents.
 */
export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/**
 * Tool result block for multi-turn agent conversations.
 */
export interface ToolResultBlock {
  type: "tool_result";
  tool_use_id: string;
  content: string;
}

/**
 * Content block from the assistant — text or tool_use.
 */
export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> };

export interface AgentCompletionRequest {
  model?: string;
  messages: ChatMessage[];
  system?: string;
  tools?: ToolDefinition[];
  maxTokens?: number;
}

export interface AgentCompletionResponse {
  content: ContentBlock[];
  usage: {
    input: number;
    output: number;
  };
}

/**
 * Common interface all providers must implement.
 */
export interface AIProvider {
  /** Provider name for logging/metrics */
  readonly name: string;

  /** Whether this provider is configured and available */
  isAvailable(): Promise<boolean>;

  /** Simple chat completion (non-streaming) */
  chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;

  /** Streaming chat completion */
  chatStream(
    request: ChatCompletionRequest,
    callbacks: StreamCallbacks,
  ): Promise<void>;

  /** Agent-style completion with tool use (non-streaming) */
  agentChat(request: AgentCompletionRequest): Promise<AgentCompletionResponse>;

  /** Generate an embedding vector (optional — throws if not supported) */
  embed?(request: EmbeddingRequest): Promise<EmbeddingResponse>;
}
