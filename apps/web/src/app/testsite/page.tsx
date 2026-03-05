"use client";

import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";

const AI_CREDITS_EXHAUSTED_CODE = "AI_CREDITS_EXHAUSTED";
const AI_CREDITS_EXHAUSTED_MESSAGE =
  "You have reached the daily limit of 100 AI text optimizations. Please try again tomorrow.";

interface OptimizeApiError {
  code: string | null;
  message: string;
}

class OptimizeRequestError extends Error {
  readonly code: string | null;

  constructor(payload: OptimizeApiError) {
    super(payload.message);
    this.name = "OptimizeRequestError";
    this.code = payload.code;
  }
}

function getApiError(value: unknown): OptimizeApiError {
  if (typeof value === "string") {
    return { code: null, message: value };
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof value.message === "string" &&
    value.message.length > 0
  ) {
    const apiCode = "code" in value && typeof value.code === "string" && value.code.length > 0 ? value.code : null;
    return {
      code: apiCode,
      message: value.message,
    };
  }

  return {
    code: null,
    message: "An unknown error occurred while optimizing text.",
  };
}

function getStreamChunk(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  return String(value);
}

export default function TestSitePage(): React.JSX.Element {
  const [inputText, setInputText] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const activeStreamRef = useRef<AsyncGenerator<unknown> | null>(null);

  const optimizeMutation = useMutation({
    mutationFn: async ({ text, onChunk }: { text: string; onChunk: (chunk: string) => void }): Promise<void> => {
      const { data, error } = await api.ai.optimize.post({ text });

      if (error) {
        throw new OptimizeRequestError(getApiError(error.value));
      }

      if (!data) {
        throw new OptimizeRequestError({ code: null, message: "Invalid optimize response." });
      }

      activeStreamRef.current = data;

      try {
        for await (const chunk of data) {
          onChunk(getStreamChunk(chunk));
        }
      } finally {
        activeStreamRef.current = null;
      }
    },
  });

  async function handleOptimize(): Promise<void> {
    if (!inputText.trim() || optimizeMutation.isPending) return;

    setResult("");
    setError(null);
    optimizeMutation.reset();

    try {
      await optimizeMutation.mutateAsync({
        text: inputText.trim(),
        onChunk: (chunk: string): void => {
          setResult((prev) => prev + chunk);
        },
      });
    } catch (err: unknown) {
      if (err instanceof OptimizeRequestError && err.code === AI_CREDITS_EXHAUSTED_CODE) {
        toast.error(AI_CREDITS_EXHAUSTED_MESSAGE);
      }

      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    }
  }

  async function handleStop(): Promise<void> {
    if (!activeStreamRef.current) {
      return;
    }

    await activeStreamRef.current.return(undefined);
    activeStreamRef.current = null;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <div>
        <h1 className="font-bold text-2xl text-gray-900">AI Text Optimizer</h1>
        <p className="mt-1 text-gray-500 text-sm">
          Paste any text below and click <strong>Optimize Text</strong> to get an improved, grammar-fixed version.
        </p>
      </div>

      {/* Input */}
      <div className="flex flex-col gap-2">
        <label htmlFor="input-text" className="font-medium text-gray-700 text-sm">
          Input Text
        </label>
        <textarea
          id="input-text"
          rows={8}
          className="w-full resize-y rounded-lg border border-gray-300 p-3 text-gray-900 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Enter text to optimize..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={optimizeMutation.isPending}
        />
      </div>

      {/* Action */}
      <button
        type="button"
        onClick={handleOptimize}
        disabled={optimizeMutation.isPending || !inputText.trim()}
        className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-sm text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {optimizeMutation.isPending ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Optimizing…
          </>
        ) : (
          "Optimize Text"
        )}
      </button>
      <button
        type="button"
        onClick={() => void handleStop()}
        disabled={!optimizeMutation.isPending}
        className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 font-semibold text-gray-700 text-sm shadow transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Stop
      </button>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 text-sm" role="alert">
          {error}
        </div>
      )}

      {/* Result */}
      {(result || optimizeMutation.isPending) && (
        <div className="flex flex-col gap-2">
          <p className="font-medium text-gray-700 text-sm">Optimized Result</p>
          <pre
            className="min-h-32 w-full whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-4 text-gray-800 text-sm leading-relaxed"
            aria-busy={optimizeMutation.isPending}
            aria-live="polite"
            aria-atomic="false"
          >
            {result}
            {optimizeMutation.isPending && (
              <span className="inline-block h-4 w-0.5 animate-pulse bg-blue-500 align-middle" />
            )}
          </pre>
        </div>
      )}
    </div>
  );
}
