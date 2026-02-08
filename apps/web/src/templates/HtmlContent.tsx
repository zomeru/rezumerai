"use client";

import type { Config as DOMPurifyConfig } from "dompurify";
import DOMPurify from "dompurify";
import { useMemo } from "react";

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
export default function HtmlContent({ html, className }: HtmlContentProps): React.JSX.Element | null {
  const sanitizedHtml = useMemo(() => {
    if (!html) return "";

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

    return DOMPurify.sanitize(html, config);
  }, [html]);

  if (!sanitizedHtml) return null;

  // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML is sanitized via DOMPurify with strict whitelist
  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
}
