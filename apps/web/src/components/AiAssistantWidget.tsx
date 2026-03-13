"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Bot, Loader2, Send, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import LLMMarkdownRenderer from "@/components/ai/LLMMarkdownRenderer";
import { useAssistantMessageHistory } from "@/hooks/useAi";
import { extractDisplayTextFromUiMessageParts, toDisplaySafeUiMessageParts } from "@/lib/ai-message-parts";
import {
  ensureAnonymousSession,
  getSessionUserRole,
  hasSessionIdentity,
  isAnonymousSession,
  useSession,
} from "@/lib/auth-client";

const INITIAL_ASSISTANT_COPY = "Ask about Rezumerai, your resumes, or admin data based on your current access.";

const DEFAULT_PANEL_SIZE = {
  width: 384,
  height: 512,
} as const;

const MIN_PANEL_SIZE = {
  width: 320,
  height: 448,
} as const;

const MAX_PANEL_WIDTH = 640;
const DEFAULT_ASSISTANT_THREAD_ID = "assistant-widget";

type PanelSize = {
  width: number;
  height: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeInlineContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (typeof content === "number" || typeof content === "boolean") {
    return String(content);
  }

  if (content == null) {
    return "";
  }

  try {
    return JSON.stringify(content, null, 2);
  } catch {
    return String(content);
  }
}

function mergeMessages(olderMessages: UIMessage[], currentMessages: UIMessage[]): UIMessage[] {
  const messageOrder: string[] = [];
  const mergedById = new Map<string, UIMessage>();

  for (const message of [...olderMessages, ...currentMessages]) {
    if (!mergedById.has(message.id)) {
      messageOrder.push(message.id);
    }

    mergedById.set(message.id, message);
  }

  return messageOrder.map((id) => mergedById.get(id)).filter((message): message is UIMessage => Boolean(message));
}

function getVisibleMessageTextParts(parts: UIMessage["parts"]): Array<{ key: string; text: string }> {
  let characterOffset = 0;

  return toDisplaySafeUiMessageParts(parts).flatMap((part) => {
    if (!("text" in part) || typeof part.text !== "string") {
      return [];
    }

    const key = `${characterOffset}-${part.text}`;
    characterOffset += part.text.length;

    return [{ key, text: part.text }];
  });
}

function MessageBody({ content }: { content: string }): React.JSX.Element {
  return <LLMMarkdownRenderer className="text-slate-700" content={content} />;
}

export default function AiAssistantWidget(): React.JSX.Element {
  const pathname = usePathname();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const pendingScrollRestoreHeightRef = useRef<number | null>(null);
  const shouldScrollToBottomRef = useRef(false);
  const resizeStateRef = useRef<{
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);
  const { data: session, isPending: isSessionPending } = useSession();
  const hasAssistantIdentity = hasSessionIdentity(session);
  const isAnonymous = isAnonymousSession(session);

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [panelSize, setPanelSize] = useState<PanelSize>(DEFAULT_PANEL_SIZE);
  const [isResizing, setIsResizing] = useState(false);
  const [isPreparingSession, setIsPreparingSession] = useState(false);
  const assistantIdentityKey =
    hasAssistantIdentity && session?.user?.id ? `${session.user.id}:${isAnonymous ? "anonymous" : "registered"}` : null;
  const previousAssistantIdentityKeyRef = useRef<string | null>(null);

  const history = useAssistantMessageHistory({
    enabled: isOpen && hasAssistantIdentity,
    identityKey: assistantIdentityKey,
    limit: 20,
    threadId: DEFAULT_ASSISTANT_THREAD_ID,
  });
  const historyMessages = useMemo<UIMessage[]>(() => {
    const pages = history.data?.pages ?? [];

    return pages
      .slice()
      .reverse()
      .flatMap((page) => page.messages);
  }, [history.data]);
  const role = getSessionUserRole(session);
  const scope =
    history.data?.pages[0]?.scope ?? (role === "ADMIN" ? "ADMIN" : role === "USER" && !isAnonymous ? "USER" : "PUBLIC");

  const { messages, sendMessage, setMessages, status } = useChat<UIMessage>({
    id: DEFAULT_ASSISTANT_THREAD_ID,
    messages: historyMessages,
    transport: new DefaultChatTransport({
      api: "/api/ai/assistant/chat",
      prepareSendMessagesRequest: ({ id, messages }) => ({
        body: {
          id,
          message: messages[messages.length - 1],
          currentPath: pathname ?? "/",
        },
      }),
    }),
    onError: (error) => {
      toast.error(error.message || "Assistant request failed.");
    },
  });

  useEffect(() => {
    if (!isOpen || isSessionPending || hasAssistantIdentity || isPreparingSession) {
      return;
    }

    setIsPreparingSession(true);

    void ensureAnonymousSession(session)
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Unable to prepare the assistant.";
        toast.error(message);
      })
      .finally(() => {
        setIsPreparingSession(false);
      });
  }, [hasAssistantIdentity, isOpen, isPreparingSession, isSessionPending, session]);

  useEffect(() => {
    if (assistantIdentityKey === previousAssistantIdentityKeyRef.current) {
      return;
    }

    previousAssistantIdentityKeyRef.current = assistantIdentityKey;
    setMessages(assistantIdentityKey ? historyMessages : []);
  }, [assistantIdentityKey, historyMessages, setMessages]);

  useEffect(() => {
    if (historyMessages.length === 0) {
      return;
    }

    setMessages((currentMessages) => mergeMessages(historyMessages, currentMessages));
  }, [historyMessages, setMessages]);

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    function stopResizing(): void {
      resizeStateRef.current = null;
      setIsResizing(false);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }

    function onPointerMove(event: PointerEvent): void {
      const resizeState = resizeStateRef.current;

      if (!resizeState) {
        return;
      }

      const maxWidth = Math.min(MAX_PANEL_WIDTH, window.innerWidth - 32);
      const maxHeight = Math.min(Math.floor(window.innerHeight * 0.8), window.innerHeight - 32);
      const nextWidth = clamp(
        resizeState.startWidth - (event.clientX - resizeState.startX),
        MIN_PANEL_SIZE.width,
        Math.max(MIN_PANEL_SIZE.width, maxWidth),
      );
      const nextHeight = clamp(
        resizeState.startHeight - (event.clientY - resizeState.startY),
        MIN_PANEL_SIZE.height,
        Math.max(MIN_PANEL_SIZE.height, maxHeight),
      );

      setPanelSize({
        width: nextWidth,
        height: nextHeight,
      });
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopResizing);
    window.addEventListener("pointercancel", stopResizing);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopResizing);
      window.removeEventListener("pointercancel", stopResizing);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isResizing]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    shouldScrollToBottomRef.current = true;
  }, [isOpen]);

  useEffect(() => {
    const container = scrollContainerRef.current;

    if (!container) {
      return;
    }

    if (pendingScrollRestoreHeightRef.current != null) {
      const previousHeight = pendingScrollRestoreHeightRef.current;
      pendingScrollRestoreHeightRef.current = null;
      container.scrollTop += container.scrollHeight - previousHeight;
      return;
    }

    if (!shouldScrollToBottomRef.current) {
      return;
    }

    shouldScrollToBottomRef.current = false;
    container.scrollTop = container.scrollHeight;
  }, [messages, history.isFetchingNextPage, status]);

  function onResizeHandlePointerDown(event: React.PointerEvent<HTMLButtonElement>): void {
    event.preventDefault();
    event.stopPropagation();

    resizeStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startWidth: panelSize.width,
      startHeight: panelSize.height,
    };
    setIsResizing(true);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "nwse-resize";
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const nextInput = input.trim();

    if (!nextInput || status === "submitted" || status === "streaming" || isPreparingSession || isSessionPending) {
      return;
    }

    if (!hasAssistantIdentity) {
      setIsPreparingSession(true);

      try {
        await ensureAnonymousSession(session);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to prepare the assistant.";
        toast.error(message);
        setIsPreparingSession(false);
        return;
      }

      setIsPreparingSession(false);
    }

    setInput("");
    shouldScrollToBottomRef.current = true;
    await sendMessage({ text: nextInput });
  }

  async function onMessagesScroll(event: React.UIEvent<HTMLDivElement>): Promise<void> {
    const container = event.currentTarget;

    if (container.scrollTop > 48 || !history.hasNextPage || history.isFetchingNextPage) {
      return;
    }

    pendingScrollRestoreHeightRef.current = container.scrollHeight;
    await history.fetchNextPage();
  }

  const isChatBusy = status === "submitted" || status === "streaming";
  const showLoadingState =
    (isSessionPending || isPreparingSession || history.isLoading) &&
    messages.length === 0 &&
    historyMessages.length === 0;

  return (
    <aside aria-label="AI assistant" className="fixed right-4 bottom-4 z-100 flex flex-col items-end gap-3">
      {isOpen && (
        <div
          className="relative flex max-h-[80vh] min-h-112 min-w-[20rem] max-w-[min(90vw,40rem)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15"
          style={{
            width: `${panelSize.width}px`,
            height: `${panelSize.height}px`,
          }}
        >
          <button
            type="button"
            aria-label="Resize assistant"
            onPointerDown={onResizeHandlePointerDown}
            className="absolute top-2 left-2 z-10 flex h-5 w-5 cursor-nwse-resize items-start justify-start rounded-full border border-white/20 bg-white/10 text-white/70 transition hover:bg-white/15 hover:text-white"
            style={{ touchAction: "none" }}
          >
            <span className="pointer-events-none block h-2.5 w-2.5 border-white/70 border-t border-l" />
          </button>
          <div className="flex items-center justify-between border-slate-200 border-b bg-slate-950 px-4 py-3 text-white">
            <div className="pl-6">
              <p className="font-semibold text-sm">Rezumerai Assistant</p>
              <p className="text-slate-300 text-xs">Scope: {scope}</p>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} className="rounded-full p-1.5 hover:bg-white/10">
              <X className="size-4" />
            </button>
          </div>

          <div
            ref={scrollContainerRef}
            onScroll={(event) => {
              void onMessagesScroll(event);
            }}
            className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4"
          >
            {history.isFetchingNextPage && (
              <div className="flex items-center justify-center gap-2 py-1 text-slate-500 text-xs">
                <Loader2 className="size-3 animate-spin" />
                Loading older messages...
              </div>
            )}

            {showLoadingState ? (
              <div className="flex h-full items-center justify-center gap-2 text-slate-500 text-sm">
                <Loader2 className="size-4 animate-spin" />
                Preparing assistant...
              </div>
            ) : messages.length === 0 ? (
              <div className="mr-auto max-w-[90%] rounded-2xl bg-white px-4 py-3 text-slate-700 text-sm shadow-sm">
                {INITIAL_ASSISTANT_COPY}
              </div>
            ) : (
              messages.map((message) => {
                const visibleTextParts = getVisibleMessageTextParts(message.parts);
                const assistantContent = extractDisplayTextFromUiMessageParts(message.parts);

                if (message.role === "assistant" && visibleTextParts.length === 0) {
                  return null;
                }

                return (
                  <div
                    key={message.id}
                    className={`wrap-anywhere min-w-0 max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.role === "assistant"
                        ? "mr-auto bg-white text-slate-700 shadow-sm"
                        : "ml-auto bg-primary-600 text-white"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <MessageBody content={assistantContent} />
                    ) : (
                      <div className="space-y-2">
                        {visibleTextParts.map((part) => (
                          <p key={`${message.id}-${part.key}`} className="whitespace-pre-wrap">
                            {normalizeInlineContent(part.text)}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {isChatBusy && (
              <div className="mr-auto rounded-2xl bg-white px-4 py-3 shadow-sm">
                <div
                  aria-label="Assistant is responding"
                  role="status"
                  className="flex items-center gap-1.5 text-slate-500"
                >
                  <span className="sr-only">Assistant is responding</span>
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={`assistant-typing-${dot}`}
                      className="size-2 animate-bounce rounded-full bg-slate-400"
                      style={{ animationDelay: `${dot * 0.12}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="border-slate-200 border-t bg-white p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="Ask the assistant..."
                className="min-h-24 flex-1 resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-primary-500"
                disabled={isSessionPending || isPreparingSession}
              />
              <button
                type="submit"
                disabled={isChatBusy || isSessionPending || isPreparingSession || !input.trim()}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary-600 text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isChatBusy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </button>
            </div>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-3 font-semibold text-sm text-white shadow-xl transition hover:bg-slate-900"
      >
        {isOpen ? <X className="size-4" /> : <Bot className="size-4" />}
        <span>Assistant</span>
        {!isOpen && <Sparkles className="size-4 text-primary-300" />}
      </button>
    </aside>
  );
}
