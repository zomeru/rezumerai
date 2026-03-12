import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { ERROR_MESSAGES } from "@/constants/errors";

const completeMock = mock(async () => "Optimized text");
const stopMock = mock(() => undefined);
const toastErrorMock = mock(() => undefined);
const useSessionMock = mock();
const useAiSettingsMock = mock();

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

mock.module("@/hooks/useAi", () => ({
  useAiSettings: useAiSettingsMock,
}));

mock.module("@/lib/auth-client", () => ({
  isAnonymousSession: (session: { user?: { isAnonymous?: boolean | null } } | null | undefined) =>
    session?.user?.isAnonymous === true,
  useSession: useSessionMock,
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

const { buildOptimizeCompletionRequest, default: TextOptimizerPage } = await import("../page");

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
        modelId: "openrouter/openai/gpt-4.1-mini",
        name: "GPT-4.1 Mini",
        providerName: "OPENROUTER",
        providerDisplayName: "OpenRouter",
      },
    ],
    selectedModelId: "openrouter/openai/gpt-4.1-mini",
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

describe("/text-optimizer", () => {
  beforeEach(() => {
    cleanup();

    completeMock.mockReset();
    completeMock.mockImplementation(async () => "Optimized text");

    stopMock.mockReset();
    toastErrorMock.mockReset();

    lastUseCompletionOptions = null;
    completionState = createCompletionState();

    useSessionMock.mockReset();
    useSessionMock.mockReturnValue({
      data: createSession(),
      isPending: false,
    });

    useAiSettingsMock.mockReset();
    useAiSettingsMock.mockImplementation(({ enabled }: { enabled?: boolean } = {}) => ({
      data: enabled === false ? undefined : createAiSettings(),
      isLoading: false,
      error: null,
    }));
  });

  afterEach(() => {
    cleanup();
  });

  it("configures useCompletion for the AI SDK optimize endpoint", () => {
    render(<TextOptimizerPage />);

    expect(lastUseCompletionOptions).toMatchObject({
      api: "/api/ai/optimize",
      credentials: "include",
      streamProtocol: "text",
    });
  });

  it("builds the AI SDK completion payload with a trimmed prompt and model override", () => {
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

  it("toasts parsed optimize errors from the AI SDK hook", () => {
    render(<TextOptimizerPage />);

    const onError = lastUseCompletionOptions?.onError;

    expect(onError).toBeDefined();

    if (typeof onError === "function") {
      onError(new Error(JSON.stringify({ message: "Credits exhausted." })));
    }

    expect(toastErrorMock).toHaveBeenCalledWith("Credits exhausted.");
  });

  it("stops the active completion stream through the AI SDK hook", () => {
    completionState = createCompletionState({
      completion: "Partial result",
      isLoading: true,
    });

    const view = render(<TextOptimizerPage />);

    fireEvent.click(view.getByRole("button", { name: "Stop" }));

    expect(stopMock).toHaveBeenCalledTimes(1);
  });

  it("renders optimized markdown responses with the shared renderer", () => {
    completionState = createCompletionState({
      completion: "# Refined copy\n\n- Stronger action verb\n\n```ts\nconst score = 92;\n```",
    });

    const view = render(<TextOptimizerPage />);

    expect(view.getByRole("heading", { name: "Refined copy" })).toBeTruthy();
    expect(view.getByText("Stronger action verb").closest("li")).toBeTruthy();
    expect(view.getByRole("button", { name: /copy code/i })).toBeTruthy();
  });

  it("parses JSON optimize errors into user-facing text", () => {
    completionState = createCompletionState({
      error: new Error(JSON.stringify({ message: "Model failed." })),
    });

    const view = render(<TextOptimizerPage />);

    expect(view.getByRole("alert").textContent).toContain("Model failed.");
  });

  it("blocks anonymous sessions from the optimizer page", () => {
    useSessionMock.mockReturnValue({
      data: createSession({ isAnonymous: true }),
      isPending: false,
    });

    const view = render(<TextOptimizerPage />);

    expect(view.getByText(ERROR_MESSAGES.AI_AUTH_REQUIRED)).toBeTruthy();
    expect(view.getByRole("button", { name: "Optimize Text" })).toHaveProperty("disabled", true);
  });
});
