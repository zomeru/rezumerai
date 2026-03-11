import { beforeEach, describe, expect, it, mock } from "bun:test";
import { fireEvent, render } from "@testing-library/react";

const sendMessageMock = mock(async () => undefined);
const setMessagesMock = mock(() => undefined);
const toastErrorMock = mock(() => undefined);
const useChatMock = mock();
const useSessionMock = mock();
const useAssistantMessageHistoryMock = mock();
const useAccountSettingsMock = mock();
const ensureAnonymousSessionMock = mock(async () => undefined);
const hasSessionIdentityMock = mock(() => true);
const isAnonymousSessionMock = mock(() => false);

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

mock.module("@/hooks/useAi", () => ({
  useAssistantMessageHistory: useAssistantMessageHistoryMock,
  useAiSettings: mock(() => ({ data: undefined, isLoading: false, error: null })),
}));

mock.module("@/hooks/useAccount", () => ({
  useAccountSettings: useAccountSettingsMock,
}));

mock.module("@/lib/auth-client", () => ({
  ensureAnonymousSession: ensureAnonymousSessionMock,
  hasSessionIdentity: hasSessionIdentityMock,
  isAnonymousSession: isAnonymousSessionMock,
  useSession: useSessionMock,
  signIn: { anonymous: mock(async () => ({ data: null })) },
  signOut: mock(async () => undefined),
  signUp: mock(async () => undefined),
  changePassword: mock(async () => undefined),
  startAnonymousSession: (
    signInAnonymous: (payload: Record<string, never>) => Promise<unknown> = async () => ({ data: null }),
  ) => signInAnonymous({}),
  hasRegisteredSession: mock(() => false),
}));

const { default: AiAssistantWidget } = await import("../AiAssistantWidget");

describe("AiAssistantWidget", () => {
  beforeEach(() => {
    sendMessageMock.mockReset();
    setMessagesMock.mockReset();
    toastErrorMock.mockReset();
    ensureAnonymousSessionMock.mockReset();
    hasSessionIdentityMock.mockReset();
    hasSessionIdentityMock.mockReturnValue(true);
    isAnonymousSessionMock.mockReset();
    isAnonymousSessionMock.mockReturnValue(false);

    useSessionMock.mockReset();
    useSessionMock.mockReturnValue({
      data: {
        user: {
          id: "user_123",
        },
      },
      isPending: false,
    });

    useAccountSettingsMock.mockReset();
    useAccountSettingsMock.mockReturnValue({
      data: {
        user: {
          role: "USER",
        },
      },
    });

    useAssistantMessageHistoryMock.mockReset();
    useAssistantMessageHistoryMock.mockReturnValue({
      data: {
        pages: [],
      },
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

  it("renders assistant markdown responses with the shared renderer", () => {
    const view = render(<AiAssistantWidget />);

    fireEvent.click(view.getByRole("button", { name: "Assistant" }));

    expect(view.getByRole("heading", { name: "Response" })).toBeTruthy();
    expect(view.getByText("First bullet").closest("li")).toBeTruthy();
    expect(view.getByRole("button", { name: /copy code/i })).toBeTruthy();
  });
});
