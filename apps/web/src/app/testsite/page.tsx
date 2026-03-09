"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { DisabledTooltip } from "@/components/ui/DisabledTooltip";
import { Select } from "@/components/ui/Select";
import { ERROR_MESSAGES } from "@/constants/errors";
import { useAiSettings } from "@/hooks/useAi";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

const AI_CREDITS_EXHAUSTED_CODE = "AI_CREDITS_EXHAUSTED";

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

function isAsyncGenerator(value: unknown): value is AsyncGenerator<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    Symbol.asyncIterator in value &&
    typeof value[Symbol.asyncIterator] === "function"
  );
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
    message: ERROR_MESSAGES.AI_OPTIMIZE_UNKNOWN_ERROR,
  };
}

function getStreamChunk(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  return String(value);
}

export default function TestSitePage(): React.JSX.Element {
  const { data: session, isPending: isSessionPending } = useSession();
  const isAiRestricted = session?.user ? !session.user.emailVerified : false;
  const {
    data: aiSettings,
    isLoading: isAiSettingsLoading,
    error: aiSettingsError,
  } = useAiSettings({
    enabled: !isSessionPending && !isAiRestricted,
  });
  const [inputText, setInputText] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const activeStreamRef = useRef<AsyncGenerator<unknown> | null>(null);
  const stopRequestedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!aiSettings) return;
    setSelectedModelId(aiSettings.selectedModelId);
  }, [aiSettings]);

  const modelOptions = useMemo(() => {
    if (!aiSettings) return [];

    return aiSettings.models.map((model: (typeof aiSettings.models)[number]) => ({
      value: model.modelId,
      label: `${model.providerDisplayName} — ${model.name}`,
    }));
  }, [aiSettings]);

  const optimizeMutation = useMutation({
    mutationFn: async ({
      text,
      modelId,
      onChunk,
    }: {
      text: string;
      modelId: string;
      onChunk: (chunk: string) => void;
    }): Promise<void> => {
      const { data, error } = await api.ai.optimize.post({ text, modelId });

      if (error) {
        throw new OptimizeRequestError(getApiError(error.value));
      }

      if (!data) {
        throw new OptimizeRequestError({ code: null, message: ERROR_MESSAGES.AI_OPTIMIZE_INVALID_RESPONSE });
      }

      if (typeof data === "string") {
        throw new OptimizeRequestError({ code: null, message: data });
      }

      if (!isAsyncGenerator(data)) {
        throw new OptimizeRequestError({ code: null, message: ERROR_MESSAGES.AI_OPTIMIZE_INVALID_RESPONSE });
      }

      const stream = data;
      activeStreamRef.current = stream;

      try {
        for await (const chunk of stream) {
          if (stopRequestedRef.current) {
            await stream.return(undefined);
            break;
          }
          onChunk(getStreamChunk(chunk));
        }
      } finally {
        activeStreamRef.current = null;
      }
    },
  });

  async function handleOptimize(): Promise<void> {
    if (!inputText.trim() || !selectedModelId || isStreaming) return;

    stopRequestedRef.current = false;
    setResult("");
    setError(null);
    setIsStreaming(true);
    optimizeMutation.reset();

    try {
      await optimizeMutation.mutateAsync({
        text: inputText.trim(),
        modelId: selectedModelId,
        onChunk: (chunk: string): void => {
          setResult((prev) => prev + chunk);
        },
      });
    } catch (err: unknown) {
      if (stopRequestedRef.current) {
        return;
      }

      if (err instanceof OptimizeRequestError && err.code === AI_CREDITS_EXHAUSTED_CODE) {
        toast.error(err.message);
      }

      setError(err instanceof Error ? err.message : ERROR_MESSAGES.AI_OPTIMIZE_UNEXPECTED_ERROR);
    } finally {
      setIsStreaming(false);
      stopRequestedRef.current = false;
    }
  }

  async function handleStop(): Promise<void> {
    if (!isStreaming) {
      return;
    }

    stopRequestedRef.current = true;
    setIsStreaming(false);
    optimizeMutation.reset();

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
        <Select
          label="AI Model"
          value={selectedModelId}
          onChange={(nextValue) => setSelectedModelId(nextValue)}
          options={modelOptions}
          placeholder={ERROR_MESSAGES.AI_NO_ACTIVE_MODELS}
          disabled={isAiRestricted || isStreaming || isAiSettingsLoading || !aiSettings?.models.length}
        />
        {isAiSettingsLoading && <p className="text-gray-500 text-xs">{ERROR_MESSAGES.AI_MODELS_LOADING}</p>}
        {isAiRestricted && <p className="text-amber-700 text-xs">{ERROR_MESSAGES.AI_EMAIL_VERIFICATION_REQUIRED}</p>}
        {aiSettingsError && <p className="text-red-600 text-xs">{ERROR_MESSAGES.AI_MODELS_LOAD_FAILED}</p>}
      </div>

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
          disabled={isStreaming}
        />
      </div>

      {/* Action */}
      {isAiRestricted ? (
        <DisabledTooltip message={ERROR_MESSAGES.AI_EMAIL_VERIFICATION_REQUIRED} className="w-full">
          <button
            type="button"
            disabled
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-sm text-white opacity-50 shadow"
          >
            Optimize Text
          </button>
        </DisabledTooltip>
      ) : (
        <button
          type="button"
          onClick={handleOptimize}
          disabled={isStreaming || !inputText.trim() || !selectedModelId}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-sm text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isStreaming ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Optimizing…
            </>
          ) : (
            "Optimize Text"
          )}
        </button>
      )}
      <button
        type="button"
        onClick={() => void handleStop()}
        disabled={!isStreaming}
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
      {(result || isStreaming) && (
        <div className="flex flex-col gap-2">
          <p className="font-medium text-gray-700 text-sm">Optimized Result</p>
          <pre
            className="min-h-32 w-full whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-4 text-gray-800 text-sm leading-relaxed"
            aria-busy={isStreaming}
            aria-live="polite"
            aria-atomic="false"
          >
            {result}
            {isStreaming && <span className="inline-block h-4 w-0.5 animate-pulse bg-blue-500 align-middle" />}
          </pre>
        </div>
      )}
    </div>
  );
}
