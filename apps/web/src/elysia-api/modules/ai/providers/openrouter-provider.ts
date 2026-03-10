import { z } from "zod";
import { ERROR_MESSAGES } from "@/constants/errors";
import { serverEnv } from "@/env";
import { type OpenRouterStreamChunk, toChatUsageMetrics, toModelUsageMetrics } from "../mapper";
import type { StructuredModelResult } from "../types";
import { parseJsonResponse } from "../utils";
import type { AiProvider, StructuredModelCallOptions, TextModelCallOptions } from "./provider";

type OpenRouterModule = typeof import("@openrouter/sdk");

interface OpenRouterRuntime {
  client: InstanceType<OpenRouterModule["OpenRouter"]>;
  stepCountIs: OpenRouterModule["stepCountIs"];
}

function isOpenRouterStreamChunk(value: unknown): value is OpenRouterStreamChunk {
  return typeof value === "object" && value !== null;
}

let openRouterRuntimePromise: Promise<OpenRouterRuntime> | null = null;

async function getOpenRouterRuntime(): Promise<OpenRouterRuntime> {
  if (!openRouterRuntimePromise) {
    openRouterRuntimePromise = import("@openrouter/sdk").then(({ OpenRouter, stepCountIs }) => ({
      client: new OpenRouter({
        apiKey: serverEnv?.OPENROUTER_API_KEY,
      }),
      stepCountIs,
    }));
  }

  return openRouterRuntimePromise;
}

async function runStructuredModel<T extends Record<string, unknown>>(
  options: StructuredModelCallOptions<T>,
): Promise<StructuredModelResult<T>> {
  const { client } = await getOpenRouterRuntime();
  const response = await client.chat.send({
    chatGenerationParams: {
      model: options.modelId,
      messages: [
        { role: "system", content: options.instructions },
        ...options.input.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ],
      responseFormat: {
        type: "json_schema",
        jsonSchema: {
          name: "resume_copilot_response",
          schema: z.toJSONSchema(options.schema),
          strict: true,
        },
      },
    },
  });
  const messageContent = response.choices[0]?.message?.content;
  const text = typeof messageContent === "string" ? messageContent : JSON.stringify(messageContent ?? {});

  return {
    data: parseJsonResponse(text, options.schema),
    usage: toChatUsageMetrics(response.usage),
    toolNames: [],
  };
}

async function runTextModel(options: TextModelCallOptions) {
  const { client, stepCountIs } = await getOpenRouterRuntime();
  const result = client.callModel({
    model: options.modelId,
    instructions: options.instructions,
    input: options.input,
    tools: options.tools,
    stopWhen: stepCountIs(options.maxSteps),
  });

  const [text, response, toolCalls] = await Promise.all([
    result.getText(),
    result.getResponse(),
    result.getToolCalls(),
  ]);

  return {
    text: text.trim() || ERROR_MESSAGES.AI_ASSISTANT_UNKNOWN_ERROR,
    usage: toModelUsageMetrics(response.usage),
    toolNames: toolCalls.map((toolCall) => toolCall.name),
  };
}

export const openRouterAiProvider: AiProvider = {
  async createOptimizeStream({ input, modelId, systemPrompt }) {
    const { client } = await getOpenRouterRuntime();

    return client.chat.send({
      chatGenerationParams: {
        model: modelId,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input },
        ],
        stream: true,
      },
    });
  },
  async *streamOptimizeText(stream, options) {
    for await (const chunk of stream) {
      if (!isOpenRouterStreamChunk(chunk)) {
        continue;
      }

      const content = chunk.choices?.[0]?.delta?.content;

      if (content) {
        yield content;
      }

      if (chunk.usage) {
        options?.onUsage?.(toChatUsageMetrics(chunk.usage));
      }
    }
  },
  runStructuredModel,
  runTextModel,
};
