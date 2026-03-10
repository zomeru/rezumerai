import { describe, expect, it } from "bun:test";
import { ERROR_MESSAGES } from "@/constants/errors";
import { consumeOptimizeResponse, OptimizeRequestError } from "../optimize-stream";

function createTextStreamResponse(chunks: string[], init?: ResponseInit): Response {
  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }

        controller.close();
      },
    }),
    {
      status: 200,
      headers: {
        "content-type": "text/plain; charset=utf-8",
      },
      ...init,
    },
  );
}

describe("consumeOptimizeResponse", () => {
  it("streams 200 optimize responses chunk by chunk", async () => {
    const received: string[] = [];

    await consumeOptimizeResponse(createTextStreamResponse(["Hello", " ", "world"]), (chunk) => {
      received.push(chunk);
    });

    expect(received).toEqual(["Hello", " ", "world"]);
  });

  it("throws the API error payload for non-2xx responses", async () => {
    const response = new Response(JSON.stringify({ code: "AI_MODEL_UNAVAILABLE", message: "Model failed." }), {
      status: 422,
      headers: {
        "content-type": "application/json",
      },
    });

    const error = await consumeOptimizeResponse(response, () => undefined).catch((reason) => reason);

    expect(error).toBeInstanceOf(OptimizeRequestError);
    expect((error as OptimizeRequestError).code).toBe("AI_MODEL_UNAVAILABLE");
    expect((error as OptimizeRequestError).message).toBe("Model failed.");
  });

  it("throws an invalid response error when a 200 response has no readable body", async () => {
    const response = new Response(null, { status: 200 });
    const error = await consumeOptimizeResponse(response, () => undefined).catch((reason) => reason);

    expect(error).toBeInstanceOf(OptimizeRequestError);
    expect((error as OptimizeRequestError).message).toBe(ERROR_MESSAGES.AI_OPTIMIZE_INVALID_RESPONSE);
  });
});
