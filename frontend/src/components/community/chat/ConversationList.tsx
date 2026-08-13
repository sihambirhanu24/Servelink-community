'use client';

import { useState, useEffect } from 'react';
import { Search, Loader, BookOpen, Layers } from 'lucide-react';
import { fetchAccessibleChatGroups, type ChatGroup } from '@/services/chat';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function buildPreview(group: ChatGroup): string {
  if (group.lastMessage) {
    const sender = group.lastMessage.senderName.split(' ')[0];
    const preview = group.lastMessage.content.slice(0, 40);
    return `${sender}: ${preview}${group.lastMessage.content.length > 40 ? '…' : ''}`;
  }
  if (group.memberCount && group.memberCount > 0) {
    return `${group.memberCount} member${group.memberCount === 1 ? '' : 's'}`;
  }
  return 'No messages yet';
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ConversationListProps {
  activeId: string;
  onSelect: (id: string) => void;
}

export function ConversationList({ activeId, onSelect }: ConversationListProps) {
  const [query, setQuery]       = useState('');
  const [groups, setGroups]     = useState<ChatGroup[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetchAccessibleChatGroups()
      .then(setGroups)
      .catch(() => {/* silently keep empty list */})
      .finally(() => setLoading(false));
  }, []);

  const filtered = groups.filter((g) =>
    g.name.toLowerCase().includes(query.toLowerCase()) ||
    (g.department ?? '').toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="w-72 shrink-0 border-r border-slate-200 bg-white flex flex-col">
      {/* Search */}
      <div className="p-4 border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search communities…"
            className="w-full rounded-lg bg-slate-100 pl-9 pr-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#043658]/20"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8 px-4">
            {query ? 'No communities match your search' : 'No communities found'}
          </p>
        ) : (
          filtered.map((g) => {
            const active = g.id === activeId;
            const isDept = g.subtype === 'DEPARTMENT';
            return (
              <button
                key={g.id}
                onClick={() => onSelect(g.id)}
                className={`flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-left transition-colors mb-0.5 ${
                  active ? 'bg-[#043658]' : 'hover:bg-slate-50'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 ${
                    active
                      ? 'bg-[#FFC107] text-[#043658]'
                      : 'bg-slate-100 text-[#043658]'
                  }`}
                >
                  {isDept
                    ? <BookOpen className="w-4 h-4" />
                    : getInitials(g.name)}
                </div>

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className={`text-sm font-medium truncate ${active ? 'text-white' : 'text-[#043658]'}`}>
                      {g.name}
                    </p>
                    {g.unreadCount > 0 && (
                      <span className="flex-shrink-0 bg-[#FFC107] text-[#043658] text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {g.unreadCount > 9 ? '9+' : g.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs truncate ${active ? 'text-slate-300' : 'text-slate-400'}`}>
                    {buildPreview(g)}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer hint */}
      {!loading && filtered.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 flex items-center gap-1">
            <Layers className="w-3 h-3" />
            {groups.filter(g => g.subtype === 'DEPARTMENT').length} dept ·{' '}
            {groups.filter(g => g.subtype === 'COMMON').length} common
          </p>
        </div>
      )}
    </div>
  );
}
