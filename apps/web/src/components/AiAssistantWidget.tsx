"use client";

import type { AssistantChatMessage, AssistantReplyBlock } from "@rezumerai/types";
import { Bot, Loader2, Send, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useAccountSettings } from "@/hooks/useAccount";
import { useAssistantChat } from "@/hooks/useAi";
import { useSession } from "@/lib/auth-client";

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

function normalizeAssistantContent(content: string): string {
  return content
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+(\d+\.\s+\*\*?)/g, "\n$1")
    .replace(/[ \t]+(\d+\.\s+)/g, "\n$1")
    .replace(/[ \t]+([-*]\s+)/g, "\n$1")
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

    if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      const items: string[] = [];

      while (index < lines.length && /^[-*]\s+/.test(lines[index] ?? "")) {
        items.push((lines[index] ?? "").replace(/^[-*]\s+/, "").trim());
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

function renderInlineText(content: string): React.ReactNode {
  const parts = content.split(/(\*\*.*?\*\*)/g).filter(Boolean);

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
    <div className="space-y-2">
      {messageBlocks.map((block) => {
        if (block.type === "ordered-list") {
          const blockKey = `ordered-${block.items.join("|")}`;

          return (
            <ol key={blockKey} className="list-decimal space-y-1 pl-5">
              {block.items.map((item) => (
                <li key={`ordered-item-${item}`}>{renderInlineText(item)}</li>
              ))}
            </ol>
          );
        }

        if (block.type === "unordered-list") {
          const blockKey = `unordered-${block.items.join("|")}`;

          return (
            <ul key={blockKey} className="list-disc space-y-1 pl-5">
              {block.items.map((item) => (
                <li key={`unordered-item-${item}`}>{renderInlineText(item)}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`paragraph-${block.content}`} className="whitespace-pre-wrap">
            {renderInlineText(block.content)}
          </p>
        );
      })}
    </div>
  );
}

export default function AiAssistantWidget(): React.JSX.Element {
  const pathname = usePathname();
  const assistantChat = useAssistantChat();
  const { data: session } = useSession();
  const accountSettings = useAccountSettings({
    enabled: Boolean(session?.user?.id),
    retry: false,
  });

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<WidgetMessage[]>(INITIAL_MESSAGES);
  const [responseScope, setResponseScope] = useState<"PUBLIC" | "USER" | "ADMIN" | null>(null);

  const role = accountSettings.data?.user.role;
  const scope =
    responseScope ?? (role === "ADMIN" ? "ADMIN" : role === "USER" || session?.user?.id ? "USER" : "PUBLIC");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const nextInput = input.trim();
    if (!nextInput || assistantChat.isPending) {
      return;
    }

    const nextMessages: WidgetMessage[] = [
      ...messages,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: nextInput,
      },
    ];

    setMessages(nextMessages);
    setInput("");

    try {
      const response = await assistantChat.mutateAsync({
        messages: nextMessages.slice(-8).map((message) => ({
          role: message.role,
          content: message.content,
        })),
        currentPath: pathname ?? "/",
      });

      setResponseScope(response.scope);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.reply,
          blocks: response.blocks,
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Assistant request failed.";
      toast.error(message);
    }
  }

  return (
    <aside aria-label="AI assistant" className="fixed right-4 bottom-4 z-100 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="flex h-128 w-[24rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
          <div className="flex items-center justify-between border-slate-200 border-b bg-slate-950 px-4 py-3 text-white">
            <div>
              <p className="font-semibold text-sm">Rezumerai Assistant</p>
              <p className="text-slate-300 text-xs">Scope: {scope}</p>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} className="rounded-full p-1.5 hover:bg-white/10">
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 ${
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
              />
              <button
                type="submit"
                disabled={assistantChat.isPending || !input.trim()}
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
