"use client";

import { useCompletion } from "@ai-sdk/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import LLMMarkdownRenderer from "@/components/ai/LLMMarkdownRenderer";
import { DisabledTooltip } from "@/components/ui/DisabledTooltip";
import { Select } from "@/components/ui/Select";
import { ERROR_MESSAGES } from "@/constants/errors";
import { useAiSettings } from "@/hooks/useAi";
import { getAiFeatureAccessMessage } from "@/lib/ai-access";
import { isAnonymousSession, useSession } from "@/lib/auth-client";

function parseOptimizeErrorMessage(error: Error | undefined): string | null {
  if (!error) {
    return null;
  }

  const message = error.message.trim();

  if (message.length === 0) {
    return ERROR_MESSAGES.AI_OPTIMIZE_UNEXPECTED_ERROR;
  }

  try {
    const payload = JSON.parse(message);

    if (typeof payload === "string" && payload.length > 0) {
      return payload;
    }

    if (
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string" &&
      payload.message.length > 0
    ) {
      return payload.message;
    }
  } catch {
    return message;
  }

  return message;
}

export function buildOptimizeCompletionRequest(inputText: string, selectedModelId: string) {
  return {
    prompt: inputText.trim(),
    options: {
      body: {
        modelId: selectedModelId,
      },
    },
  };
}

export default function TestSitePage(): React.JSX.Element {
  const { data: session, isPending: isSessionPending } = useSession();
  const isAnonymous = isAnonymousSession(session);
  const aiAccessMessage = getAiFeatureAccessMessage({
    isAnonymous,
    emailVerified: session?.user?.emailVerified,
  });
  const isAiRestricted = aiAccessMessage !== null;
  const {
    data: aiSettings,
    isLoading: isAiSettingsLoading,
    error: aiSettingsError,
  } = useAiSettings({
    enabled: !isSessionPending && !isAnonymous && !isAiRestricted,
  });
  const [inputText, setInputText] = useState<string>("");
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const { completion, complete, error, isLoading, stop } = useCompletion({
    api: "/api/ai/optimize",
    credentials: "include",
    streamProtocol: "text",
    onError: (requestError) => {
      toast.error(parseOptimizeErrorMessage(requestError) ?? ERROR_MESSAGES.AI_OPTIMIZE_UNEXPECTED_ERROR);
    },
  });
  const errorMessage = parseOptimizeErrorMessage(error);

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

  function handleOptimize(): void {
    if (!inputText.trim() || !selectedModelId || isLoading) return;

    const request = buildOptimizeCompletionRequest(inputText, selectedModelId);

    void complete(request.prompt, request.options);
  }

  function handleStop(): void {
    if (!isLoading) {
      return;
    }

    stop();
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
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
          disabled={isAiRestricted || isLoading || isAiSettingsLoading || !aiSettings?.models.length}
        />
        {isAiSettingsLoading && <p className="text-gray-500 text-xs">{ERROR_MESSAGES.AI_MODELS_LOADING}</p>}
        {aiAccessMessage && <p className="text-amber-700 text-xs">{aiAccessMessage}</p>}
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
          disabled={isLoading}
        />
      </div>

      {/* Action */}
      {aiAccessMessage ? (
        <DisabledTooltip message={aiAccessMessage} className="w-full">
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
          disabled={isLoading || !inputText.trim() || !selectedModelId}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-sm text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
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
        onClick={handleStop}
        disabled={!isLoading}
        className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 font-semibold text-gray-700 text-sm shadow transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Stop
      </button>

      {/* Error */}
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 text-sm" role="alert">
          {errorMessage}
        </div>
      )}

      {/* Result */}
      {(completion || isLoading) && (
        <div className="flex flex-col gap-2">
          <p className="font-medium text-gray-700 text-sm">Optimized Result</p>
          <div
            className="min-h-32 w-full rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
            aria-busy={isLoading}
            aria-live="polite"
            aria-atomic="false"
          >
            <LLMMarkdownRenderer content={completion} />
            {isLoading && (
              <div className="mt-3 flex items-center gap-2 text-blue-600 text-xs">
                <span className="inline-block h-4 w-0.5 animate-pulse bg-blue-500 align-middle" />
                Streaming response...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
