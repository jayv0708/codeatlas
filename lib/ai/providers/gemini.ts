/**
 * Gemini AI Provider
 *
 * Wraps the Google Generative AI SDK to implement the AIProvider interface.
 * Supports chat, streaming, and agent-style completions.
 *
 * Environment variables:
 *   GEMINI_API_KEY    — Google AI API key
 *   GEMINI_MODEL      — e.g. gemini-2.5-flash (default)
 */

import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import type {
  AIProvider,
  AgentCompletionRequest,
  AgentCompletionResponse,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ContentBlock,
  StreamCallbacks,
} from "./types";

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;

  constructor() {
    // Defer client creation to first use
  }

  private getModel(): GenerativeModel {
    if (!this.model) {
      const key = process.env.GEMINI_API_KEY;
      if (!key) throw new Error("GEMINI_API_KEY is not configured");
      this.genAI = new GoogleGenerativeAI(key);
      this.model = this.genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      });
    }
    return this.model;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const model = this.getModel();
      const result = await model.generateContent("ping");
      return result.response.text().length > 0;
    } catch {
      return false;
    }
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const model = this.getModel();

    // Build the prompt with system instruction
    const systemInstruction = request.system || undefined;

    // Convert messages to Gemini format
    const contents = this.toGeminiContents(request.messages);

    const result = await model.generateContent({
      contents,
      generationConfig: {
        maxOutputTokens: request.maxTokens ?? 2048,
        temperature: request.temperature,
      },
      systemInstruction,
    });

    const text = result.response.text();
    const usageMetadata = result.response.usageMetadata;

    return {
      content: text || "No response generated.",
      usage: {
        input: usageMetadata?.promptTokenCount ?? 0,
        output: usageMetadata?.candidatesTokenCount ?? 0,
      },
    };
  }

  async chatStream(
    request: ChatCompletionRequest,
    callbacks: StreamCallbacks,
  ): Promise<void> {
    const model = this.getModel();

    const systemInstruction = request.system || undefined;
    const contents = this.toGeminiContents(request.messages);

    const result = await model.generateContentStream({
      contents,
      generationConfig: {
        maxOutputTokens: request.maxTokens ?? 2048,
        temperature: request.temperature,
      },
      systemInstruction,
    });

    let inputTokens = 0;
    let outputTokens = 0;

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        callbacks.onChunk(text);
      }
      const usage = chunk.usageMetadata;
      if (usage) {
        inputTokens = usage.promptTokenCount ?? 0;
        outputTokens = usage.candidatesTokenCount ?? 0;
      }
    }

    callbacks.onDone({ input: inputTokens, output: outputTokens });
  }

  async agentChat(
    request: AgentCompletionRequest,
  ): Promise<AgentCompletionResponse> {
    // For agent chat, we'll use the basic chat since tool calling requires complex types
    const response = await this.chat({
      messages: request.messages,
      system: request.system,
      maxTokens: request.maxTokens,
    });

    const content: ContentBlock[] = [
      { type: "text", text: response.content },
    ];

    return {
      content,
      usage: response.usage,
    };
  }

  private toGeminiContents(
    messages: ChatCompletionRequest["messages"],
  ): Array<{ role: string; parts: Array<{ text: string }> }> {
    return messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
  }
}
