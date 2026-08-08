'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

interface Conversation {
  id: string;
  initials: string;
  name: string;
  preview: string; // "2.4k members" OR "Dr. Sarah: Ready for the review?" OR "48 new messages"
}

const MOCK_CONVERSATIONS: Conversation[] = [
  { id: '1', initials: 'NS', name: 'National STEM Educators Hub', preview: '2.4k members' },
  { id: '2', initials: 'WR', name: 'Woreda Robotics Lab', preview: 'Dr. Sarah: Ready for the review?' },
  { id: '3', initials: 'ZS', name: 'Zonal Satellite Committee', preview: '48 new messages' },
];

interface ConversationListProps {
  activeId: string;
  onSelect: (id: string) => void;
}

export function ConversationList({ activeId, onSelect }: ConversationListProps) {
  const [query, setQuery] = useState('');

  const filtered = MOCK_CONVERSATIONS.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="w-72 shrink-0 border-r border-slate-200 bg-white flex flex-col">
      <div className="p-4 border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search discussions..."
            className="w-full rounded-lg bg-slate-100 pl-9 pr-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {filtered.map((c) => {
          const active = c.id === activeId;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-left transition-colors ${
                active ? 'bg-[#043658]' : 'hover:bg-slate-50'
              }`}
            >
              <div
                className={`h-9 w-9 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 ${
                  active ? 'bg-[#FFC107] text-[#043658]' : 'bg-slate-100 text-[#043658]'
                }`}
              >
                {c.initials}
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-medium truncate ${active ? 'text-white' : 'text-[#043658]'}`}>
                  {c.name}
                </p>
                <p className={`text-xs truncate ${active ? 'text-slate-300' : 'text-slate-400'}`}>
                  {c.preview}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
