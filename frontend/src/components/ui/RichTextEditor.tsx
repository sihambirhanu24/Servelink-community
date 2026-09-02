"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon } from "lucide-react";
import DOMPurify from "isomorphic-dompurify";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write something...",
  minHeight = "150px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);
  
  const [activeStates, setActiveStates] = useState({
    bold: false,
    italic: false,
    underline: false,
    insertUnorderedList: false,
    insertOrderedList: false,
  });

  // Track formatting states on cursor move or selection change
  const checkFormatting = useCallback(() => {
    if (!editorRef.current || !editorRef.current.contains(document.activeElement)) return;
    
    setActiveStates({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      insertOrderedList: document.queryCommandState("insertOrderedList"),
    });
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", checkFormatting);
    return () => {
      document.removeEventListener("selectionchange", checkFormatting);
    };
  }, [checkFormatting]);

  const formatText = useCallback((command: string, cmdValue?: string) => {
    document.execCommand(command, false, cmdValue);
    // Focus back on editor and trigger change
    if (editorRef.current) {
      editorRef.current.focus();
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleLink = useCallback(() => {
    const url = prompt("Enter URL:");
    if (url) {
      // Sanitize URL to prevent javascript: and data: URLs
      const sanitizedUrl = url.replace(/^(javascript|data):/i, '');
      formatText("createLink", sanitizedUrl);
    }
  }, [formatText]);

  // Set initial value, but prevent cursor jump during typing
  useEffect(() => {
    if (isUpdatingRef.current) {
      isUpdatingRef.current = false;
      return;
    }
    
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      isUpdatingRef.current = true;
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    isUpdatingRef.current = true;
    onChange(e.currentTarget.innerHTML);
    checkFormatting();
  }, [onChange, checkFormatting]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    isUpdatingRef.current = true;
    onChange(e.currentTarget.innerHTML);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          formatText('bold');
          break;
        case 'i':
          e.preventDefault();
          formatText('italic');
          break;
        case 'u':
          e.preventDefault();
          formatText('underline');
          break;
      }
    }
  }, [formatText]);

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="mb-2 flex items-center gap-1 rounded-lg border-2 border-slate-200 bg-slate-50 p-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => formatText("bold")}
          className={`rounded-md p-1.5 transition-all ${
            activeStates.bold 
              ? "bg-[#043658] text-white hover:bg-[#032742]" 
              : "hover:bg-[#FFC107]/20 hover:text-[#043658] text-slate-600"
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => formatText("italic")}
          className={`rounded-md p-1.5 transition-all ${
            activeStates.italic 
              ? "bg-[#043658] text-white hover:bg-[#032742]" 
              : "hover:bg-[#FFC107]/20 hover:text-[#043658] text-slate-600"
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => formatText("underline")}
          className={`rounded-md p-1.5 transition-all ${
            activeStates.underline 
              ? "bg-[#043658] text-white hover:bg-[#032742]" 
              : "hover:bg-[#FFC107]/20 hover:text-[#043658] text-slate-600"
          }`}
          title="Underline (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </button>
        
        <div className="mx-1 h-4 w-px bg-slate-300" />
        
        <button
          type="button"
          onClick={() => formatText("insertUnorderedList")}
          className={`rounded-md p-1.5 transition-all ${
            activeStates.insertUnorderedList 
              ? "bg-[#043658] text-white hover:bg-[#032742]" 
              : "hover:bg-[#FFC107]/20 hover:text-[#043658] text-slate-600"
          }`}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => formatText("insertOrderedList")}
          className={`rounded-md p-1.5 transition-all ${
            activeStates.insertOrderedList 
              ? "bg-[#043658] text-white hover:bg-[#032742]" 
              : "hover:bg-[#FFC107]/20 hover:text-[#043658] text-slate-600"
          }`}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        
        <div className="mx-1 h-4 w-px bg-slate-300" />
        
        <button
          type="button"
          onClick={handleLink}
          className="rounded-md p-1.5 hover:bg-[#FFC107]/20 hover:text-[#043658] text-slate-600 transition-all"
          title="Insert Link"
        >
          <LinkIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onFocus={checkFormatting}
        onMouseUp={checkFormatting}
        style={{ minHeight }}
        className="min-h-[150px] rounded-lg border-2 border-slate-200 p-3 text-sm text-[#043658] focus:border-[#FFC107] focus:outline-none focus:ring-2 focus:ring-[#FFC107]/20 transition-all bg-white relative empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none prose prose-sm max-w-none prose-p:my-2 prose-ul:list-disc prose-ol:list-decimal prose-ul:pl-4 prose-ol:pl-4 prose-a:text-[#043658] prose-a:underline hover:prose-a:text-[#FFC107]"
        data-placeholder={placeholder}
      />
    </div>
  );
}
