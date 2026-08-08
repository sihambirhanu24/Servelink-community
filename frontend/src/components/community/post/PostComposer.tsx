'use client';

import { useState } from 'react';
import { Image as ImageIcon, FileText, BarChart2 } from 'lucide-react';

interface PostComposerProps {
  authorInitials: string;
  authorAvatarUrl?: string;
  onSubmit: (text: string) => void;
}

export function PostComposer({ authorInitials, authorAvatarUrl, onSubmit }: PostComposerProps) {
  const [text, setText] = useState('');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        {authorAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={authorAvatarUrl} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-[#043658] flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {authorInitials}
          </div>
        )}

        {/* Filled pill input - this is the piece that was missing before */}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start a discussion or share a resource..."
          className="flex-1 rounded-full bg-slate-100 px-4 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#043658]/20"
        />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#043658] transition-colors">
            <ImageIcon className="h-4 w-4" /> Media
          </button>
          <span className="h-4 w-px bg-slate-200" />
          <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#043658] transition-colors">
            <FileText className="h-4 w-4" /> File
          </button>
          <span className="h-4 w-px bg-slate-200" />
          <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#043658] transition-colors">
            <BarChart2 className="h-4 w-4" /> Poll
          </button>
        </div>

        <button
          onClick={() => text.trim() && onSubmit(text)}
          disabled={!text.trim()}
          className="rounded-full bg-[#043658] px-6 py-2 text-sm font-medium text-white hover:bg-[#043658]/90 transition-colors disabled:opacity-40"
        >
          Post
        </button>
      </div>
    </div>
  );
}
