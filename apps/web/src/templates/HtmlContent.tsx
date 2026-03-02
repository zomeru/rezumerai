"use client";

import type { Config as DOMPurifyConfig } from "dompurify";
import { useEffect, useState } from "react";

interface HtmlContentProps {
  html: string;
  className?: string;
}

/**
 * Renders sanitized HTML content from the rich text editor (Tiptap).
 * Used in resume templates to properly display formatted text
 * (paragraphs, bold, italic, lists, etc.) instead of raw HTML tags.
 *
 * Security: Uses DOMPurify to sanitize HTML and prevent XSS attacks.
 */
export default function HtmlContent({ html, className }: HtmlContentProps) {
  const [sanitizedHtml, setSanitizedHtml] = useState<string>("");

  useEffect(() => {
    let isActive = true;

    const sanitizeHtml = async (): Promise<void> => {
      if (!html) {
        if (isActive) {
          setSanitizedHtml("");
        }
        return;
      }

      // Configure DOMPurify to allow only safe Tiptap HTML elements
      const config: DOMPurifyConfig = {
        ALLOWED_TAGS: [
          "p",
          "br",
          "strong",
          "em",
          "u",
          "s",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "ul",
          "ol",
          "li",
          "a",
          "span",
          "mark",
        ],
        ALLOWED_ATTR: ["href", "class", "style", "target", "rel"],
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
      };

      const domPurifyModule = await import("dompurify");
      const domPurifyDefault = domPurifyModule.default as {
        sanitize?: (dirty: string, cfg?: DOMPurifyConfig) => string;
      };
      const sanitize = typeof domPurifyDefault?.sanitize === "function" ? domPurifyDefault.sanitize : null;

      if (!sanitize) {
        if (isActive) {
          setSanitizedHtml("");
        }
        return;
      }

      if (isActive) {
        setSanitizedHtml(sanitize(html, config));
      }
    };

    void sanitizeHtml();

    return () => {
      isActive = false;
    };
  }, [html]);

  if (!sanitizedHtml) return null;

  // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML is sanitized via DOMPurify with strict whitelist
  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
}
