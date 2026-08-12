'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Paperclip, Loader } from 'lucide-react';
import api from '@/lib/axios';

interface ChatComposerProps {
  onSendMessage: (content: string, attachmentUrls?: string[]) => void;
  isConnected: boolean;
  communityId: string;
  onTyping?: (isTyping: boolean) => void;
}

const MAX_ATTACHMENTS = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'video/mp4', 'video/webm', 'video/quicktime'];

export function ChatComposer({
  onSendMessage,
  isConnected,
  communityId,
  onTyping,
}: ChatComposerProps) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [content]);

  const handleTyping = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setContent(e.target.value);

      // Typing indicator
      onTyping?.(true);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onTyping?.(false);
      }, 3000);
    },
    [onTyping],
  );

  const handleSend = async () => {
    if (!content.trim() || !isConnected) return;

    const attachmentUrls = attachments.map((a) => a.url);
    onSendMessage(content, attachmentUrls);

    setContent('');
    setAttachments([]);
    onTyping?.(false);
    clearTimeout(typingTimeoutRef.current);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || isUploading) return;

    const newFiles = Array.from(files);
    if (attachments.length + newFiles.length > MAX_ATTACHMENTS) {
      alert(`Maximum ${MAX_ATTACHMENTS} attachments allowed`);
      return;
    }

    for (const file of newFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert(`File type ${file.type} not allowed`);
        continue;
      }

      setIsUploading(true);
      setUploadProgress(0);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post(`/community/${communityId}/chat/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            if (e.total) {
              setUploadProgress(Math.round((e.loaded / e.total) * 100));
            }
          },
        });

        setAttachments((prev) => [
          ...prev,
          {
            id: Math.random().toString(36),
            url: response.data.url,
            fileName: file.name,
            fileSize: file.size,
            type: response.data.type,
          },
        ]);
      } catch (error) {
        console.error('Upload failed:', error);
        alert('Failed to upload file');
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="border-t border-slate-200 bg-white p-4 space-y-3">
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="bg-slate-100 rounded px-3 py-1 text-xs flex items-center gap-2 group"
            >
              <span className="truncate">{att.fileName}</span>
              <button
                onClick={() => removeAttachment(att.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-all text-lg leading-none"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload progress */}
      {isUploading && (
        <div className="w-full bg-slate-200 rounded h-1 overflow-hidden">
          <div
            className="bg-[#043658] h-full transition-all"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Message input */}
      <div className="flex items-end gap-3">
        {/* Attach button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || attachments.length >= MAX_ATTACHMENTS}
          className="flex-shrink-0 text-slate-400 hover:text-slate-600 disabled:opacity-40 transition-colors"
          title="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          accept={ALLOWED_TYPES.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
        />

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTyping}
          onKeyDown={handleKeyDown}
          placeholder={isConnected ? 'Type a message...' : 'Connecting...'}
          disabled={!isConnected || isUploading}
          className="flex-1 resize-none border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20 disabled:bg-slate-50 max-h-24"
          rows={1}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!content.trim() || !isConnected || isUploading}
          className="flex-shrink-0 rounded-full bg-[#043658] p-2.5 text-white hover:bg-[#043658]/90 disabled:opacity-40 transition-colors"
          title="Send message"
        >
          {isUploading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Help text */}
      <div className="text-xs text-slate-400 flex items-center gap-2">
        <span>
          <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">Enter</kbd> to send
        </span>
        <span>•</span>
        <span>
          <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">Shift+Enter</kbd> for new line
        </span>
        {attachments.length > 0 && (
          <>
            <span>•</span>
            <span>{attachments.length} file(s)</span>
          </>
        )}
      </div>
    </div>
  );
}
