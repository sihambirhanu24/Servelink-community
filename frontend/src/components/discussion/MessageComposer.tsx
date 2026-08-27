'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, X } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/hooks/useProfile';

interface MessageComposerProps {
  onSend: (content: string, replyToId?: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  replyTo?: { id: string; senderName: string; content: string } | null;
  onCancelReply?: () => void;
  placeholder?: string;
}

export function MessageComposer({
  onSend,
  onTypingStart,
  onTypingStop,
  replyTo,
  onCancelReply,
  placeholder = 'Reply to discussion...',
}: MessageComposerProps) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const userImage = profile?.profileImage || user?.profileImage;
  const userName = user ? `${user.firstName} ${user.lastName}` : 'User';

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  // Handle typing indicators
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // Start typing
    if (!typingTimeoutRef.current) {
      onTypingStart();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      onTypingStop();
      typingTimeoutRef.current = null;
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    onTypingStop();

    // Send message
    onSend(content.trim(), replyTo?.id);
    
    // Clear input
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {/* Reply-to indicator */}
      {replyTo && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-600 mb-1">
              Replying to <span className="font-medium">{replyTo.senderName}</span>
            </p>
            <p className="text-sm text-gray-700 line-clamp-2">{replyTo.content}</p>
          </div>
          {onCancelReply && (
            <button
              onClick={onCancelReply}
              className="ml-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Composer */}
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <Avatar profileImage={userImage} name={userName} size="sm" />

        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#FFC107] focus:border-transparent resize-none min-h-[48px] max-h-[200px]"
            rows={1}
          />
          <p className="text-xs text-gray-500 mt-1">
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>

        <button
          type="submit"
          disabled={!content.trim()}
          className={`p-3 rounded-xl transition-colors flex-shrink-0 ${
            content.trim()
              ? 'bg-[#043658] text-white hover:bg-[#043658]/90'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
