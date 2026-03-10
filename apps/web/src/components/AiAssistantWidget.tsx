"use client";

import type { AssistantChatMessage, AssistantReplyBlock } from "@rezumerai/types";
import { Bot, Loader2, Send, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAccountSettings } from "@/hooks/useAccount";
import { useAssistantChat, useAssistantHistory } from "@/hooks/useAi";
import { ensureAnonymousSession, hasSessionIdentity, isAnonymousSession, useSession } from "@/lib/auth-client";

type WidgetMessage = AssistantChatMessage & {
  id: string;
  blocks?: AssistantReplyBlock[];
};

const INITIAL_MESSAGES: WidgetMessage[] = [
  {
    id: "assistant-welcome",
    role: "assistant",
    content: "Ask about Rezumerai, your resumes, or admin data based on your access.",
  },
];

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

function normalizeAssistantContent(content: string): string {
  return content
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+(\d+\.\s+\*\*?)/g, "\n$1")
    .replace(/[ \t]+(\d+\.\s+)/g, "\n$1")
    .replace(/[ \t]+([-*•]\s+)/g, "\n$1")
    .trim();
}

function parseMessageBlocks(content: string): AssistantReplyBlock[] {
  const normalized = normalizeAssistantContent(content);
  const lines = normalized.split("\n").map((line) => line.trim());
  const blocks: AssistantReplyBlock[] = [];
  let paragraphLines: string[] = [];

  function flushParagraph(): void {
    if (paragraphLines.length === 0) {
      return;
    }

    blocks.push({
      type: "paragraph",
      content: paragraphLines.join("\n").trim(),
    });
    paragraphLines = [];
  }

  for (let index = 0; index < lines.length; ) {
    const line = lines[index];

    if (!line) {
      flushParagraph();
      index += 1;
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      flushParagraph();
      const items: string[] = [];

      while (index < lines.length && /^\d+\.\s+/.test(lines[index] ?? "")) {
        items.push((lines[index] ?? "").replace(/^\d+\.\s+/, "").trim());
        index += 1;
      }

      blocks.push({
        type: "ordered-list",
        items,
      });
      continue;
    }

    if (/^[-*•]\s+/.test(line)) {
      flushParagraph();
      const items: string[] = [];

      while (index < lines.length && /^[-*•]\s+/.test(lines[index] ?? "")) {
        items.push((lines[index] ?? "").replace(/^[-*•]\s+/, "").trim());
        index += 1;
      }

      blocks.push({
        type: "unordered-list",
        items,
      });
      continue;
    }

    paragraphLines.push(line);
    index += 1;
  }

  flushParagraph();
  return blocks;
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
    return JSON.stringify(content);
  } catch {
    return String(content);
  }
}

function renderInlineText(content: unknown): React.ReactNode {
  const normalizedContent = normalizeInlineContent(content);
  const parts = normalizedContent.split(/(\*\*.*?\*\*)/g).filter(Boolean);

  return parts.map((part) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`strong-${part}`} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={`text-${part}`}>{part}</span>;
  });
}

function AssistantMessageContent({
  content,
  blocks,
}: {
  content: string;
  blocks?: AssistantReplyBlock[];
}): React.JSX.Element {
  const messageBlocks = blocks && blocks.length > 0 ? blocks : parseMessageBlocks(content);

  return (
    <div className="space-y-3 break-words text-[0.95rem] leading-6 [overflow-wrap:anywhere]">
      {messageBlocks.map((block) => {
        if (block.type === "ordered-list") {
          const normalizedItems = block.items.map((item) => normalizeInlineContent(item));
          const blockKey = `ordered-${normalizedItems.join("|")}`;

          return (
            <ol key={blockKey} className="list-decimal space-y-2 pl-5 marker:text-slate-400">
              {normalizedItems.map((item) => (
                <li key={`ordered-item-${item}`} className="break-words [overflow-wrap:anywhere]">
                  {renderInlineText(item)}
                </li>
              ))}
            </ol>
          );
        }

        if (block.type === "unordered-list") {
          const normalizedItems = block.items.map((item) => normalizeInlineContent(item));
          const blockKey = `unordered-${normalizedItems.join("|")}`;

          return (
            <ul key={blockKey} className="list-disc space-y-2 pl-5 marker:text-slate-400">
              {normalizedItems.map((item) => (
                <li key={`unordered-item-${item}`} className="break-words [overflow-wrap:anywhere]">
                  {renderInlineText(item)}
                </li>
              ))}
            </ul>
          );
        }

        const paragraphContent = normalizeInlineContent(block.content);

        return (
          <p key={`paragraph-${paragraphContent}`} className="whitespace-pre-wrap text-slate-700">
            {renderInlineText(paragraphContent)}
          </p>
        );
      })}
    </div>
  );
}

export default function AiAssistantWidget(): React.JSX.Element {
  const pathname = usePathname();
  const assistantChat = useAssistantChat();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const pendingScrollRestoreHeightRef = useRef<number | null>(null);
  const shouldScrollToBottomRef = useRef(false);
  const { data: session, isPending: isSessionPending } = useSession();
  const hasAssistantIdentity = hasSessionIdentity(session);
  const isAnonymous = isAnonymousSession(session);
  const accountSettings = useAccountSettings({
    enabled: hasAssistantIdentity && !isAnonymous,
    retry: false,
  });

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [pendingMessages, setPendingMessages] = useState<WidgetMessage[]>([]);
  const [responseScope, setResponseScope] = useState<"PUBLIC" | "USER" | "ADMIN" | null>(null);
  const [panelSize, setPanelSize] = useState<PanelSize>(DEFAULT_PANEL_SIZE);
  const [isResizing, setIsResizing] = useState(false);
  const [isPreparingSession, setIsPreparingSession] = useState(false);
  const resizeStateRef = useRef<{
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  const role = accountSettings.data?.user.role;
  const history = useAssistantHistory({
    enabled: isOpen && hasAssistantIdentity,
    limit: 20,
    threadId: DEFAULT_ASSISTANT_THREAD_ID,
  });
  const historyMessages = useMemo<WidgetMessage[]>(() => {
    const pages = history.data?.pages ?? [];

    return pages
      .slice()
      .reverse()
      .flatMap((page) =>
        page.messages.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          blocks: message.blocks,
        })),
      );
  }, [history.data]);
  const messages =
    historyMessages.length > 0 || pendingMessages.length > 0
      ? [...historyMessages, ...pendingMessages]
      : INITIAL_MESSAGES;
  const scope =
    responseScope ??
    history.data?.pages[0]?.scope ??
    (role === "ADMIN" ? "ADMIN" : role === "USER" && !isAnonymous ? "USER" : "PUBLIC");

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
  }, [messages, history.isFetchingNextPage]);

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
    if (!nextInput || assistantChat.isPending || isPreparingSession || isSessionPending) {
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

    const optimisticUserMessage: WidgetMessage = {
      id: `pending-user-${Date.now()}`,
      role: "user",
      content: nextInput,
    };

    setPendingMessages([optimisticUserMessage]);
    setInput("");
    shouldScrollToBottomRef.current = true;

    try {
      const response = await assistantChat.mutateAsync({
        threadId: DEFAULT_ASSISTANT_THREAD_ID,
        messages: [
          {
            role: "user",
            content: nextInput,
          },
        ],
        currentPath: pathname ?? "/",
      });

      setResponseScope(response.scope);
      setPendingMessages([
        optimisticUserMessage,
        {
          id: `pending-assistant-${Date.now()}`,
          role: "assistant",
          content: response.reply,
          blocks: response.blocks,
        },
      ]);
      await history.refetch();
      setPendingMessages([]);
      shouldScrollToBottomRef.current = true;
    } catch (error) {
      setPendingMessages([]);
      const message = error instanceof Error ? error.message : "Assistant request failed.";
      toast.error(message);
    }
  }

  async function onMessagesScroll(event: React.UIEvent<HTMLDivElement>): Promise<void> {
    const container = event.currentTarget;

    if (container.scrollTop > 48 || !history.hasNextPage || history.isFetchingNextPage) {
      return;
    }

    pendingScrollRestoreHeightRef.current = container.scrollHeight;
    await history.fetchNextPage();
  }

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

            {(isSessionPending || isPreparingSession) &&
            historyMessages.length === 0 &&
            pendingMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center gap-2 text-slate-500 text-sm">
                <Loader2 className="size-4 animate-spin" />
                Preparing assistant...
              </div>
            ) : history.isLoading && historyMessages.length === 0 && pendingMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center gap-2 text-slate-500 text-sm">
                <Loader2 className="size-4 animate-spin" />
                Loading conversation...
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`min-w-0 max-w-[90%] break-words rounded-2xl px-4 py-3 text-sm leading-6 [overflow-wrap:anywhere] ${
                      message.role === "assistant"
                        ? "mr-auto bg-white text-slate-700 shadow-sm"
                        : "ml-auto bg-primary-600 text-white"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <AssistantMessageContent content={message.content} blocks={message.blocks} />
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                ))}
              </>
            )}

            {assistantChat.isPending && (
              <div className="mr-auto flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-slate-600 text-sm shadow-sm">
                <Loader2 className="size-4 animate-spin" />
                Thinking...
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
                disabled={assistantChat.isPending || isSessionPending || isPreparingSession || !input.trim()}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary-600 text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {assistantChat.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
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
