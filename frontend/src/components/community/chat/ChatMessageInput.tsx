'use client';

import { useState } from 'react';
import { Paperclip, Smile, Send } from 'lucide-react';

interface ChatMessageInputProps {
  groupName: string;
  onSend: (text: string) => void;
}

export function ChatMessageInput({ groupName, onSend }: ChatMessageInputProps) {
  const [text, setText] = useState('');

  return (
    <div className="border-t border-slate-100 p-4">
      <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
        <button className="text-slate-400 hover:text-[#043658]">
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Type a message to ${groupName}...`}
          className="flex-1 bg-transparent text-sm placeholder:text-slate-400 focus:outline-none"
        />
        <button className="text-slate-400 hover:text-[#043658]">
          <Smile className="h-4 w-4" />
        </button>
        <button
          onClick={() => text.trim() && (onSend(text), setText(''))}
          disabled={!text.trim()}
          className="rounded-full bg-[#043658] p-2 text-white hover:bg-[#043658]/90 transition-colors disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
