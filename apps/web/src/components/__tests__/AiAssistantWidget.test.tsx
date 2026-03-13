import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/react";
import {
  createAssistantMessagesResponse,
  refetchAiSettingsMock,
  resetAiHooksModuleMock,
  useAiSettingsMock,
  useAssistantMessageHistoryMock,
} from "@/test-utils/ai-hooks-module-mock";

const writableEnv = process.env as Record<string, string | undefined>;
const sendMessageMock = mock(async () => undefined);
const setMessagesMock = mock(() => undefined);
const toastErrorMock = mock(() => undefined);
const useChatMock = mock();
const useSessionMock = mock();
const ensureAnonymousSessionMock = mock(async () => undefined);
writableEnv.NEXT_PUBLIC_SITE_URL ??= "http://localhost:3000";
writableEnv.NODE_ENV ??= "test";
const authClientModule = await import("@/lib/auth-client");

mock.module("@ai-sdk/react", () => ({
  useChat: useChatMock,
  useCompletion: mock(() => ({
    completion: "",
    complete: mock(async () => undefined),
    error: undefined,
    isLoading: false,
    stop: mock(() => undefined),
    setCompletion: mock(() => undefined),
    setInput: mock(() => undefined),
    input: "",
    handleInputChange: mock(() => undefined),
    handleSubmit: mock(() => undefined),
  })),
}));

mock.module("ai", () => ({
  DefaultChatTransport: class DefaultChatTransport {},
  tool: (config: unknown) => config,
}));

mock.module("sonner", () => ({
  toast: {
    error: toastErrorMock,
  },
}));

describe("AiAssistantWidget", () => {
  beforeEach(() => {
    mock.restore();
    sendMessageMock.mockReset();
    setMessagesMock.mockReset();
    toastErrorMock.mockReset();
    ensureAnonymousSessionMock.mockReset();

    spyOn(authClientModule, "ensureAnonymousSession").mockImplementation(ensureAnonymousSessionMock);
    resetAiHooksModuleMock();
    useAiSettingsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: refetchAiSettingsMock,
    });

    useSessionMock.mockReset();
    useSessionMock.mockReturnValue({
      data: {
        user: {
          id: "user_123",
          role: "USER",
        },
      },
      isPending: false,
    });
    spyOn(authClientModule, "useSession").mockImplementation(() => useSessionMock());

    useAssistantMessageHistoryMock.mockReset();
    useAssistantMessageHistoryMock.mockReturnValue({
      data: createAssistantMessagesResponse([]),
      isLoading: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: mock(async () => undefined),
    });

    useChatMock.mockReset();
    useChatMock.mockReturnValue({
      messages: [
        {
          id: "assistant-message-1",
          role: "assistant",
          parts: [
            {
              type: "text",
              text: "# Response\n\n- First bullet\n\n```ts\nconst ready = true;\n```",
            },
          ],
        },
      ],
      sendMessage: sendMessageMock,
      setMessages: setMessagesMock,
      status: "ready",
    });
  });

  afterEach(() => {
    cleanup();
    mock.restore();
  });

  it("renders assistant markdown responses with the shared renderer", async () => {
    const { default: AiAssistantWidget } = await import(
      new URL("../AiAssistantWidget.tsx?test=ai-assistant-widget", import.meta.url).href
    );
    const view = render(<AiAssistantWidget />);

    fireEvent.click(view.getByRole("button", { name: "Assistant" }));

    expect(view.getByRole("heading", { name: "Response" })).toBeTruthy();
    expect(view.getByText("First bullet").closest("li")).toBeTruthy();
    expect(view.getByRole("button", { name: /copy code/i })).toBeTruthy();
  });
});
