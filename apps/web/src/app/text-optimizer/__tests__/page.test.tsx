import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { ERROR_MESSAGES } from "@/constants/errors";
import { refetchAiSettingsMock, resetAiHooksModuleMock, useAiSettingsMock } from "@/test-utils/ai-hooks-module-mock";

const writableEnv = process.env as Record<string, string | undefined>;
const completeMock = mock(async () => "Optimized text");
const stopMock = mock(() => undefined);
const toastErrorMock = mock(() => undefined);
const useSessionMock = mock();
writableEnv.NEXT_PUBLIC_SITE_URL ??= "http://localhost:3000";
writableEnv.NODE_ENV ??= "test";
const authClientModule = await import("@/lib/auth-client");

let textOptimizerImportVersion = 0;

let lastUseCompletionOptions: Record<string, unknown> | null = null;
let completionState = createCompletionState();

interface MockCompletionState {
  completion: string;
  complete: typeof completeMock;
  error: Error | undefined;
  handleInputChange: ReturnType<typeof mock>;
  handleSubmit: ReturnType<typeof mock>;
  input: string;
  isLoading: boolean;
  setCompletion: ReturnType<typeof mock>;
  setInput: ReturnType<typeof mock>;
  stop: typeof stopMock;
}

mock.module("@ai-sdk/react", () => ({
  useCompletion: (options: Record<string, unknown>) => {
    lastUseCompletionOptions = options;
    return completionState;
  },
}));

mock.module("sonner", () => ({
  toast: {
    error: toastErrorMock,
  },
}));

mock.module("@/components/ui/DisabledTooltip", () => ({
  DisabledTooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

mock.module("@/components/ui/Select", () => ({
  Select: ({
    label,
    value,
    onChange,
    options,
    disabled,
    placeholder,
  }: {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string; disabled?: boolean }>;
    disabled?: boolean;
    placeholder?: string;
  }) => (
    <label>
      <span>{label}</span>
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        {!value && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  ),
}));

function createCompletionState(overrides?: Partial<MockCompletionState>): MockCompletionState {
  return {
    completion: "",
    complete: completeMock,
    error: undefined as Error | undefined,
    input: "",
    isLoading: false,
    handleInputChange: mock(() => undefined),
    handleSubmit: mock(() => undefined),
    setCompletion: mock(() => undefined),
    setInput: mock(() => undefined),
    stop: stopMock,
    ...overrides,
  };
}

function createAiSettings() {
  return {
    models: [
      {
        id: "model_1",
        name: "GPT-4.1 Mini",
        contextLength: 128_000,
        inputModalities: ["text"],
        outputModalities: ["text"],
        supportedParameters: ["temperature"],
      },
    ],
    selectedModelId: "model_1",
  };
}

function createSession(options?: { emailVerified?: boolean; isAnonymous?: boolean }) {
  return {
    user: {
      emailVerified: options?.emailVerified ?? true,
      isAnonymous: options?.isAnonymous ?? false,
    },
  };
}

async function loadTextOptimizerPageModule() {
  textOptimizerImportVersion += 1;

  return import(new URL(`../page.tsx?test=text-optimizer-${textOptimizerImportVersion}`, import.meta.url).href);
}

describe("/text-optimizer", () => {
  beforeEach(() => {
    cleanup();
    mock.restore();

    completeMock.mockReset();
    completeMock.mockImplementation(async () => "Optimized text");

    stopMock.mockReset();
    toastErrorMock.mockReset();
    resetAiHooksModuleMock();

    lastUseCompletionOptions = null;
    completionState = createCompletionState();

    useSessionMock.mockReset();
    useSessionMock.mockReturnValue({
      data: createSession(),
      isPending: false,
    });
    spyOn(authClientModule, "useSession").mockImplementation(() => useSessionMock());

    useAiSettingsMock.mockReset();
    useAiSettingsMock.mockImplementation(({ enabled }: { enabled?: boolean } = {}) => ({
      data: enabled === false ? undefined : createAiSettings(),
      isLoading: false,
      error: null,
      refetch: refetchAiSettingsMock,
    }));
  });

  afterEach(() => {
    cleanup();
    mock.restore();
  });

  it("configures useCompletion for the AI SDK optimize endpoint", async () => {
    const { default: TextOptimizerPage } = await loadTextOptimizerPageModule();
    render(<TextOptimizerPage />);

    expect(lastUseCompletionOptions).toMatchObject({
      api: "/api/ai/optimize",
      credentials: "include",
      streamProtocol: "text",
    });
  });

  it("builds the AI SDK completion payload with a trimmed prompt and model override", async () => {
    const { buildOptimizeCompletionRequest } = await loadTextOptimizerPageModule();

    expect(buildOptimizeCompletionRequest("  Improve this resume bullet.  ", "openrouter/openai/gpt-4.1-mini")).toEqual(
      {
        prompt: "Improve this resume bullet.",
        options: {
          body: {
            modelId: "openrouter/openai/gpt-4.1-mini",
          },
        },
      },
    );
  });

  it("toasts parsed optimize errors from the AI SDK hook", async () => {
    const { default: TextOptimizerPage } = await loadTextOptimizerPageModule();
    render(<TextOptimizerPage />);

    const onError = lastUseCompletionOptions?.onError;

    expect(onError).toBeDefined();

    if (typeof onError === "function") {
      onError(new Error(JSON.stringify({ message: "Credits exhausted." })));
    }

    expect(toastErrorMock).toHaveBeenCalledWith("Credits exhausted.");
  });

  it("stops the active completion stream through the AI SDK hook", async () => {
    completionState = createCompletionState({
      completion: "Partial result",
      isLoading: true,
    });

    const { default: TextOptimizerPage } = await loadTextOptimizerPageModule();
    const view = render(<TextOptimizerPage />);

    fireEvent.click(view.getByRole("button", { name: "Stop" }));

    expect(stopMock).toHaveBeenCalledTimes(1);
  });

  it("renders optimized markdown responses with the shared renderer", async () => {
    completionState = createCompletionState({
      completion: "# Refined copy\n\n- Stronger action verb\n\n```ts\nconst score = 92;\n```",
    });

    const { default: TextOptimizerPage } = await loadTextOptimizerPageModule();
    const view = render(<TextOptimizerPage />);

    expect(view.getByRole("heading", { name: "Refined copy" })).toBeTruthy();
    expect(view.getByText("Stronger action verb").closest("li")).toBeTruthy();
    expect(view.getByRole("button", { name: /copy code/i })).toBeTruthy();
  });

  it("parses JSON optimize errors into user-facing text", async () => {
    completionState = createCompletionState({
      error: new Error(JSON.stringify({ message: "Model failed." })),
    });

    const { default: TextOptimizerPage } = await loadTextOptimizerPageModule();
    const view = render(<TextOptimizerPage />);

    expect(view.getByRole("alert").textContent).toContain("Model failed.");
  });

  it("blocks anonymous sessions from the optimizer page", async () => {
    useSessionMock.mockReturnValue({
      data: createSession({ isAnonymous: true }),
      isPending: false,
    });

    const { default: TextOptimizerPage } = await loadTextOptimizerPageModule();
    const view = render(<TextOptimizerPage />);

    expect(view.getByText(ERROR_MESSAGES.AI_AUTH_REQUIRED)).toBeTruthy();
    expect(view.getByRole("button", { name: "Optimize Text" })).toHaveProperty("disabled", true);
  });
});
