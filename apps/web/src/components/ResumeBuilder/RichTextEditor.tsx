"use client";

import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Highlighter,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Strikethrough,
  Underline as UnderlineIcon,
} from "lucide-react";
import { useEffect } from "react";

/**
 * Props for the RichTextEditor component.
 *
 * @property content - Initial HTML content string
 * @property onChange - Callback with updated HTML when content changes
 * @property placeholder - Placeholder text when editor is empty
 * @property className - Optional Tailwind classes for container styling
 */
export interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * TipTap-powered rich text editor with formatting toolbar.
 * Supports bold, italic, underline, strikethrough, lists, text alignment,
 * links, color, and highlight formatting.
 *
 * @param props - Editor configuration
 * @returns Rich text editor with toolbar, or null if editor fails to initialize
 *
 * @example
 * ```tsx
 * <RichTextEditor
 *   content={description}
 *   onChange={setDescription}
 *   placeholder="Describe your experience..."
 * />
 * ```
 */

export default function RichTextEditor({
  content,
  onChange,
  placeholder,
  className,
}: RichTextEditorProps): React.JSX.Element | null {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary-600 underline",
        },
      }),
      Color,
      TextStyle,
      Highlight.configure({
        multicolor: true,
      }),
      Placeholder.configure({
        placeholder: placeholder || "Start typing...",
      }),
    ],
    content,
    onUpdate: ({ editor }: { editor: ReturnType<typeof useEditor> }): void => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[120px] p-3",
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const setLink = (): void => {
    const url = window.prompt("Enter URL");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-1 border-slate-200 border-b bg-slate-50 p-2">
        <button
          type="button"
          onClick={(): boolean => editor.chain().focus().toggleBold().run()}
          className={`rounded p-1.5 transition-colors hover:bg-slate-200 ${
            editor.isActive("bold") ? "bg-slate-200" : ""
          }`}
          title="Bold"
        >
          <Bold className="size-4" />
        </button>
        <button
          type="button"
          onClick={(): boolean => editor.chain().focus().toggleItalic().run()}
          className={`rounded p-1.5 transition-colors hover:bg-slate-200 ${
            editor.isActive("italic") ? "bg-slate-200" : ""
          }`}
          title="Italic"
        >
          <Italic className="size-4" />
        </button>
        <button
          type="button"
          onClick={(): boolean => editor.chain().focus().toggleUnderline().run()}
          className={`rounded p-1.5 transition-colors hover:bg-slate-200 ${
            editor.isActive("underline") ? "bg-slate-200" : ""
          }`}
          title="Underline"
        >
          <UnderlineIcon className="size-4" />
        </button>
        <button
          type="button"
          onClick={(): boolean => editor.chain().focus().toggleStrike().run()}
          className={`rounded p-1.5 transition-colors hover:bg-slate-200 ${
            editor.isActive("strike") ? "bg-slate-200" : ""
          }`}
          title="Strikethrough"
        >
          <Strikethrough className="size-4" />
        </button>
        <div className="mx-1 w-px bg-slate-300" />
        <button
          type="button"
          onClick={(): boolean => editor.chain().focus().toggleBulletList().run()}
          className={`rounded p-1.5 transition-colors hover:bg-slate-200 ${
            editor.isActive("bulletList") ? "bg-slate-200" : ""
          }`}
          title="Bullet List"
        >
          <List className="size-4" />
        </button>
        <button
          type="button"
          onClick={(): boolean => editor.chain().focus().toggleOrderedList().run()}
          className={`rounded p-1.5 transition-colors hover:bg-slate-200 ${
            editor.isActive("orderedList") ? "bg-slate-200" : ""
          }`}
          title="Numbered List"
        >
          <ListOrdered className="size-4" />
        </button>
        <div className="mx-1 w-px bg-slate-300" />
        <button
          type="button"
          onClick={(): boolean => editor.chain().focus().setTextAlign("left").run()}
          className={`rounded p-1.5 transition-colors hover:bg-slate-200 ${
            editor.isActive({ textAlign: "left" }) ? "bg-slate-200" : ""
          }`}
          title="Align Left"
        >
          <AlignLeft className="size-4" />
        </button>
        <button
          type="button"
          onClick={(): boolean => editor.chain().focus().setTextAlign("center").run()}
          className={`rounded p-1.5 transition-colors hover:bg-slate-200 ${
            editor.isActive({ textAlign: "center" }) ? "bg-slate-200" : ""
          }`}
          title="Align Center"
        >
          <AlignCenter className="size-4" />
        </button>
        <button
          type="button"
          onClick={(): boolean => editor.chain().focus().setTextAlign("right").run()}
          className={`rounded p-1.5 transition-colors hover:bg-slate-200 ${
            editor.isActive({ textAlign: "right" }) ? "bg-slate-200" : ""
          }`}
          title="Align Right"
        >
          <AlignRight className="size-4" />
        </button>
        <div className="mx-1 w-px bg-slate-300" />
        <button
          type="button"
          onClick={setLink}
          className={`rounded p-1.5 transition-colors hover:bg-slate-200 ${
            editor.isActive("link") ? "bg-slate-200" : ""
          }`}
          title="Add Link"
        >
          <LinkIcon className="size-4" />
        </button>
        <button
          type="button"
          onClick={(): boolean => editor.chain().focus().toggleHighlight().run()}
          className={`rounded p-1.5 transition-colors hover:bg-slate-200 ${
            editor.isActive("highlight") ? "bg-slate-200" : ""
          }`}
          title="Highlight"
        >
          <Highlighter className="size-4" />
        </button>
      </div>
      <div className="min-h-30 border border-slate-200 bg-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
