import type { Tool } from "@openrouter/sdk";
import type { z } from "zod";
import type { AiModelInput, StreamOptimizeTextOptions, StructuredModelResult, TextModelResult } from "../types";

export interface OptimizeTextStreamRequest {
  input: string;
  modelId: string;
  systemPrompt: string;
}

export interface StructuredModelCallOptions<T extends Record<string, unknown>> {
  modelId: string;
  instructions: string;
  input: AiModelInput;
  tools: readonly Tool[];
  schema: z.ZodType<T> & z.ZodObject<z.ZodRawShape>;
  maxSteps: number;
}

export interface TextModelCallOptions {
  modelId: string;
  instructions: string;
  input: AiModelInput;
  tools: readonly Tool[];
  maxSteps: number;
}

export interface AiProvider {
  createOptimizeStream(options: OptimizeTextStreamRequest): Promise<AsyncIterable<unknown>>;
  streamOptimizeText(
    stream: AsyncIterable<unknown>,
    options?: StreamOptimizeTextOptions,
  ): AsyncGenerator<string, void, unknown>;
  runStructuredModel<T extends Record<string, unknown>>(
    options: StructuredModelCallOptions<T>,
  ): Promise<StructuredModelResult<T>>;
  runTextModel(options: TextModelCallOptions): Promise<TextModelResult>;
}
