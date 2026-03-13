import type { UIMessage } from "ai";

type UiTextPart = Extract<UIMessage["parts"][number], { type: "text" }>;

function isTextUiPart(part: unknown): part is UiTextPart {
  return (
    typeof part === "object" &&
    part !== null &&
    "type" in part &&
    part.type === "text" &&
    "text" in part &&
    typeof part.text === "string"
  );
}

export function toDisplaySafeUiMessageParts(parts: UIMessage["parts"]): UIMessage["parts"] {
  const safeParts: UiTextPart[] = [];

  for (const part of parts) {
    if (!isTextUiPart(part)) {
      continue;
    }

    safeParts.push({
      type: "text",
      text: part.text,
    } as UiTextPart);
  }

  return safeParts as UIMessage["parts"];
}

export function extractDisplayTextFromUiMessageParts(parts: UIMessage["parts"]): string {
  return toDisplaySafeUiMessageParts(parts)
    .map((part) => ("text" in part && typeof part.text === "string" ? part.text : ""))
    .join("")
    .trim();
}
