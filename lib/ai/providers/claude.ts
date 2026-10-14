/**
 * Claude AI Provider
 *
 * Wraps the Anthropic SDK to implement the AIProvider interface.
 * Supports chat, streaming, and agent-style tool-use completions.
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
  AIProvider,
  AgentCompletionRequest,
  AgentCompletionResponse,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ContentBlock,
  StreamCallbacks,
  ToolDefinition,
} from "./types";

export class ClaudeProvider implements AIProvider {
  readonly name = "claude";
  private client: Anthropic | null = null;

  constructor() {
    // Defer client creation to first use — avoids crashing at instantiation
    // time when ANTHROPIC_API_KEY is not set (useful for tests and health checks).
  }

  private getClient(): Anthropic {
    if (!this.client) {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) throw new Error("ANTHROPIC_API_KEY is not configured");
      this.client = new Anthropic({ apiKey: key });
    }
    return this.client;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const client = this.getClient();
      await client.messages.create({
        model: this.getModel(),
        max_tokens: 10,
        messages: [{ role: "user", content: "ping" }],
      });
      return true;
    } catch {
      return false;
    }
  }

  private getModel(): string {
    return process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";
  }

  private toAnthropicMessages(
    messages: ChatCompletionRequest["messages"],
  ): Anthropic.MessageParam[] {
    return messages.map((m) => ({ role: m.role, content: m.content }));
  }

  private toAnthropicTools(
    tools?: ToolDefinition[],
  ): Anthropic.Tool[] | undefined {
    if (!tools || tools.length === 0) return undefined;
    return tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.input_schema as Anthropic.Tool["input_schema"],
    }));
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const response = await this.getClient().messages.create({
      model: request.model || this.getModel(),
      max_tokens: request.maxTokens ?? 2048,
      system: request.system,
      messages: this.toAnthropicMessages(request.messages),
    });

    const text =
      response.content[0]?.type === "text"
        ? response.content[0].text
        : "No response generated.";

    return {
      content: text,
      usage: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    };
  }

  async chatStream(
    request: ChatCompletionRequest,
    callbacks: StreamCallbacks,
  ): Promise<void> {
    const stream = this.getClient().messages.stream({
      model: request.model || this.getModel(),
      max_tokens: request.maxTokens ?? 2048,
      system: request.system,
      messages: this.toAnthropicMessages(request.messages),
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        callbacks.onChunk(event.delta.text);
      }
    }

    const finalMessage = await stream.finalMessage();
    callbacks.onDone({
      input: finalMessage.usage.input_tokens,
      output: finalMessage.usage.output_tokens,
    });
  }

  async agentChat(
    request: AgentCompletionRequest,
  ): Promise<AgentCompletionResponse> {
    const response = await this.getClient().messages.create({
      model: request.model || this.getModel(),
      max_tokens: request.maxTokens ?? 2048,
      system: request.system,
      tools: this.toAnthropicTools(request.tools),
      messages: this.toAnthropicMessages(request.messages),
    });

    const content: ContentBlock[] = response.content.map((block) => {
      if (block.type === "text") {
        return { type: "text" as const, text: block.text };
      }
      if (block.type === "tool_use") {
        return {
          type: "tool_use" as const,
          id: block.id,
          name: block.name,
          input: block.input as Record<string, unknown>,
        };
      }
      return { type: "text" as const, text: "" };
    });

    return {
      content,
      usage: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    };
  }
}
