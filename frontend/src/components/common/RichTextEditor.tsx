"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { Bold, Italic, UnderlineIcon, Link as LinkIcon, List, ListOrdered } from "lucide-react";
import { useState, useCallback, useEffect } from "react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

function LinkModal({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");

  useEffect(() => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    setText(selectedText);

    const attrs = editor.getAttributes("link");
    if (attrs.href) {
      setUrl(attrs.href);
    }
  }, [editor]);

  const handleInsert = () => {
    if (!url) return;

    // Ensure URL has protocol
    const finalUrl = url.match(/^https?:\/\//) ? url : `https://${url}`;

    if (text) {
      editor.chain().focus().insertContent(`<a href="${finalUrl}">${text}</a>`).run();
    } else {
      editor.chain().focus().setLink({ href: finalUrl }).run();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-semibold text-[#043658]">Insert Link</h3>
        
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Link Text</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Visit my resource"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#043658] focus:outline-none focus:ring-1 focus:ring-[#043658]/20"
            />
          </div>
          
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#043658] focus:outline-none focus:ring-1 focus:ring-[#043658]/20"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleInsert}
            disabled={!url}
            className="flex-1 rounded-lg bg-[#043658] px-4 py-2 text-sm font-semibold text-white hover:bg-[#032742] disabled:opacity-50"
          >
            Insert Link
          </button>
        </div>
      </div>
    </div>
  );
}

export function RichTextEditor({ content, onChange, placeholder, className = "" }: RichTextEditorProps) {
  const [showLinkModal, setShowLinkModal] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Disable headings for simplicity
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-[#043658] underline hover:text-[#032742]",
          rel: "noopener noreferrer",
          target: "_blank",
        },
        validate: (href) => /^https?:\/\//.test(href),
      }),
      Underline,
    ],
    content,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[120px] px-3 py-2.5 text-sm text-slate-800",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const handleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run();
  }, [editor]);

  const handleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run();
  }, [editor]);

  const handleUnderline = useCallback(() => {
    editor?.chain().focus().toggleUnderline().run();
  }, [editor]);

  const handleBulletList = useCallback(() => {
    editor?.chain().focus().toggleBulletList().run();
  }, [editor]);

  const handleOrderedList = useCallback(() => {
    editor?.chain().focus().toggleOrderedList().run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`overflow-hidden rounded-lg border border-slate-200 ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 p-2">
        <button
          type="button"
          onClick={handleBold}
          className={`rounded p-1.5 transition-colors hover:bg-slate-200 ${
            editor.isActive("bold") ? "bg-slate-200 text-[#043658]" : "text-slate-600"
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={handleItalic}
          className={`rounded p-1.5 transition-colors hover:bg-slate-200 ${
            editor.isActive("italic") ? "bg-slate-200 text-[#043658]" : "text-slate-600"
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={handleUnderline}
          className={`rounded p-1.5 transition-colors hover:bg-slate-200 ${
            editor.isActive("underline") ? "bg-slate-200 text-[#043658]" : "text-slate-600"
          }`}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="h-4 w-4" />
        </button>

        <div className="mx-1 w-px bg-slate-300" />

        <button
          type="button"
          onClick={() => setShowLinkModal(true)}
          className={`rounded p-1.5 transition-colors hover:bg-slate-200 ${
            editor.isActive("link") ? "bg-slate-200 text-[#043658]" : "text-slate-600"
          }`}
          title="Insert Link"
        >
          <LinkIcon className="h-4 w-4" />
        </button>

        <div className="mx-1 w-px bg-slate-300" />

        <button
          type="button"
          onClick={handleBulletList}
          className={`rounded p-1.5 transition-colors hover:bg-slate-200 ${
            editor.isActive("bulletList") ? "bg-slate-200 text-[#043658]" : "text-slate-600"
          }`}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={handleOrderedList}
          className={`rounded p-1.5 transition-colors hover:bg-slate-200 ${
            editor.isActive("orderedList") ? "bg-slate-200 text-[#043658]" : "text-slate-600"
          }`}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} placeholder={placeholder} />

      {/* Link Modal */}
      {showLinkModal && <LinkModal editor={editor} onClose={() => setShowLinkModal(false)} />}
    </div>
  );
}
