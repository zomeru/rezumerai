"use client";

import { cn } from "@rezumerai/utils";
import { Check, Copy } from "lucide-react";
import type { ReactElement, ReactNode } from "react";
import { Children, isValidElement, useEffect, useState } from "react";
import ReactMarkdown, { type Components, defaultUrlTransform, type Options } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";

interface LLMMarkdownRendererProps {
  className?: string;
  content: string;
}

type CodeElementProps = {
  children?: ReactNode;
  className?: string;
};

const highlightSpanClasses = [
  "hljs-addition",
  "hljs-attr",
  "hljs-attribute",
  "hljs-built_in",
  "hljs-bullet",
  "hljs-char",
  "hljs-code",
  "hljs-comment",
  "hljs-deletion",
  "hljs-doctag",
  "hljs-emphasis",
  "hljs-formula",
  "hljs-keyword",
  "hljs-link",
  "hljs-literal",
  "hljs-meta",
  "hljs-name",
  "hljs-number",
  "hljs-operator",
  "hljs-params",
  "hljs-property",
  "hljs-punctuation",
  "hljs-quote",
  "hljs-regexp",
  "hljs-section",
  "hljs-selector-attr",
  "hljs-selector-class",
  "hljs-selector-id",
  "hljs-selector-pseudo",
  "hljs-selector-tag",
  "hljs-string",
  "hljs-strong",
  "hljs-subst",
  "hljs-symbol",
  "hljs-tag",
  "hljs-template-tag",
  "hljs-template-variable",
  "hljs-title",
  "hljs-type",
  "hljs-variable",
] as const;

const defaultSanitizeAttributes = defaultSchema.attributes ?? {};

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSanitizeAttributes,
    code: [...(defaultSanitizeAttributes.code || []), ["className", "hljs", /^language-[\w-]+$/]],
    span: [...(defaultSanitizeAttributes.span || []), ["className", ...highlightSpanClasses]],
  },
};

const rehypePlugins: Options["rehypePlugins"] = [
  [rehypeSanitize, sanitizeSchema],
  [rehypeHighlight, { detect: true }],
];

function extractTextContent(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map((child) => extractTextContent(child)).join("");
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return extractTextContent(node.props.children);
  }

  return "";
}

function getCodeElement(children: ReactNode): ReactElement<CodeElementProps> | null {
  for (const child of Children.toArray(children)) {
    if (isValidElement<CodeElementProps>(child)) {
      return child;
    }
  }

  return null;
}

function getCodeLanguage(className?: string): string | null {
  const match = className?.match(/language-([\w-]+)/i);

  return match?.[1]?.toLowerCase() ?? null;
}

function getLanguageLabel(language: string | null): string {
  if (!language) {
    return "Code";
  }

  const languageLabels: Record<string, string> = {
    bash: "Bash",
    css: "CSS",
    html: "HTML",
    javascript: "JavaScript",
    js: "JavaScript",
    json: "JSON",
    jsx: "JSX",
    markdown: "Markdown",
    md: "Markdown",
    python: "Python",
    py: "Python",
    shell: "Shell",
    sh: "Shell",
    sql: "SQL",
    ts: "TypeScript",
    tsx: "TSX",
    txt: "Text",
    typescript: "TypeScript",
    yaml: "YAML",
    yml: "YAML",
  };

  return languageLabels[language] ?? language.replace(/-/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

function CopyCodeButton({ code }: { code: string }): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopied(false);
    }, 1800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copied]);

  async function handleCopy(): Promise<void> {
    if (!code.trim() || !navigator.clipboard?.writeText) {
      return;
    }

    await navigator.clipboard.writeText(code);
    setCopied(true);
  }

  return (
    <button
      type="button"
      onClick={() => {
        void handleCopy();
      }}
      disabled={!code.trim()}
      aria-label="Copy code"
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-medium text-[11px] text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : "Copy code"}
    </button>
  );
}

const markdownComponents: Components = {
  a: ({ node: _node, className, href, ...props }) => (
    <a
      {...props}
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        "font-medium text-primary-600 underline decoration-2 decoration-primary-300 underline-offset-4 transition hover:text-primary-700",
        className,
      )}
    />
  ),
  blockquote: ({ node: _node, className, ...props }) => (
    <blockquote
      {...props}
      className={cn(
        "my-4 rounded-r-2xl border-slate-300 border-l-4 bg-slate-100 px-4 py-3 text-slate-700 italic",
        className,
      )}
    />
  ),
  code: ({ node: _node, className, children, ...props }) => {
    const isCodeBlock = Boolean(className && /(language-|hljs)/.test(className));

    if (isCodeBlock) {
      return (
        <code {...props} className={cn("font-mono", className)}>
          {children}
        </code>
      );
    }

    return (
      <code {...props} className="rounded-md bg-slate-200/80 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-900">
        {children}
      </code>
    );
  },
  h1: ({ node: _node, className, ...props }) => (
    <h1
      {...props}
      className={cn("mt-6 mb-3 font-semibold text-2xl text-slate-950 tracking-tight first:mt-0", className)}
    />
  ),
  h2: ({ node: _node, className, ...props }) => (
    <h2
      {...props}
      className={cn("mt-6 mb-3 font-semibold text-slate-950 text-xl tracking-tight first:mt-0", className)}
    />
  ),
  h3: ({ node: _node, className, ...props }) => (
    <h3 {...props} className={cn("mt-5 mb-2 font-semibold text-lg text-slate-900 first:mt-0", className)} />
  ),
  hr: ({ node: _node, className, ...props }) => <hr {...props} className={cn("my-6 border-slate-200", className)} />,
  li: ({ node: _node, className, ...props }) => (
    <li {...props} className={cn("pl-1 marker:text-slate-400", className)} />
  ),
  ol: ({ node: _node, className, ...props }) => (
    <ol {...props} className={cn("my-4 ml-6 list-decimal space-y-2 text-slate-700", className)} />
  ),
  p: ({ node: _node, className, ...props }) => (
    <p {...props} className={cn("my-3 text-slate-700 leading-7", className)} />
  ),
  pre: ({ node: _node, className, children, ...props }) => {
    const codeElement = getCodeElement(children);
    const language = getCodeLanguage(codeElement?.props.className);
    const rawCode = extractTextContent(codeElement?.props.children ?? children).replace(/\n$/, "");

    return (
      <div className="not-prose my-4 overflow-hidden rounded-2xl border border-slate-900/10 bg-[#0b1220] shadow-sm">
        <div className="flex items-center justify-between gap-3 border-white/10 border-b bg-white/5 px-3 py-2">
          <span className="truncate font-medium text-[11px] text-slate-300 uppercase tracking-[0.22em]">
            {getLanguageLabel(language)}
          </span>
          <CopyCodeButton code={rawCode} />
        </div>
        <pre {...props} className={cn("overflow-x-auto px-4 py-4 text-[13px] text-slate-100 leading-6", className)}>
          {children}
        </pre>
      </div>
    );
  },
  strong: ({ node: _node, className, ...props }) => (
    <strong {...props} className={cn("font-semibold text-slate-950", className)} />
  ),
  table: ({ node: _node, className, ...props }) => (
    <div className="my-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table {...props} className={cn("min-w-full border-collapse text-left text-sm", className)} />
    </div>
  ),
  tbody: ({ node: _node, className, ...props }) => (
    <tbody {...props} className={cn("divide-y divide-slate-200", className)} />
  ),
  td: ({ node: _node, className, ...props }) => (
    <td {...props} className={cn("px-4 py-3 align-top text-slate-700", className)} />
  ),
  th: ({ node: _node, className, ...props }) => (
    <th {...props} className={cn("bg-slate-100 px-4 py-3 font-semibold text-slate-900", className)} />
  ),
  thead: ({ node: _node, className, ...props }) => (
    <thead {...props} className={cn("border-slate-200 border-b", className)} />
  ),
  ul: ({ node: _node, className, ...props }) => (
    <ul {...props} className={cn("my-4 ml-6 list-disc space-y-2 text-slate-700", className)} />
  ),
};

export default function LLMMarkdownRenderer({
  className,
  content,
}: LLMMarkdownRendererProps): React.JSX.Element | null {
  if (!content.trim()) {
    return null;
  }

  return (
    <div
      className={cn(
        "llm-markdown max-w-none text-[0.95rem] text-slate-800 leading-7 [overflow-wrap:anywhere]",
        className,
      )}
    >
      <ReactMarkdown
        components={markdownComponents}
        rehypePlugins={rehypePlugins}
        remarkPlugins={[remarkGfm]}
        skipHtml={true}
        urlTransform={defaultUrlTransform}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
