interface HtmlContentProps {
  html: string;
  className?: string;
}

/**
 * Renders sanitized HTML content from the rich text editor (Tiptap).
 * Used in resume templates to properly display formatted text
 * (paragraphs, bold, italic, lists, etc.) instead of raw HTML tags.
 */
export default function HtmlContent({ html, className }: HtmlContentProps) {
  if (!html) return null;

  // biome-ignore lint/security/noDangerouslySetInnerHtml: Content comes from the user's own Tiptap rich text editor
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
