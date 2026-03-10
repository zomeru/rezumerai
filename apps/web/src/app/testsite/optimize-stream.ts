import { ERROR_MESSAGES } from "@/constants/errors";

export interface OptimizeApiError {
  code: string | null;
  message: string;
}

export class OptimizeRequestError extends Error {
  readonly code: string | null;

  constructor(payload: OptimizeApiError) {
    super(payload.message);
    this.name = "OptimizeRequestError";
    this.code = payload.code;
  }
}

export async function consumeOptimizeResponse(
  response: Response,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (!response.ok) {
    throw new OptimizeRequestError(await parseOptimizeError(response));
  }

  if (!response.body) {
    throw new OptimizeRequestError({
      code: null,
      message: ERROR_MESSAGES.AI_OPTIMIZE_INVALID_RESPONSE,
    });
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      if (signal?.aborted) {
        await reader.cancel();
        return;
      }

      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });

      if (chunk.length > 0) {
        onChunk(chunk);
      }
    }

    const remainder = decoder.decode();

    if (remainder.length > 0) {
      onChunk(remainder);
    }
  } finally {
    reader.releaseLock();
  }
}

async function parseOptimizeError(response: Response): Promise<OptimizeApiError> {
  const contentType = response.headers.get("content-type") ?? "";
  const rawBody = await response.text();

  if (contentType.includes("application/json")) {
    try {
      return normalizeOptimizeError(JSON.parse(rawBody));
    } catch {
      return normalizeOptimizeError(rawBody);
    }
  }

  return normalizeOptimizeError(rawBody);
}

function normalizeOptimizeError(value: unknown): OptimizeApiError {
  if (typeof value === "string" && value.length > 0) {
    return { code: null, message: value };
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof value.message === "string" &&
    value.message.length > 0
  ) {
    return {
      code: "code" in value && typeof value.code === "string" && value.code.length > 0 ? value.code : null,
      message: value.message,
    };
  }

  return {
    code: null,
    message: ERROR_MESSAGES.AI_OPTIMIZE_UNKNOWN_ERROR,
  };
}
