'use client';

import { useState } from 'react';
import { Search, BadgeCheck, Users } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import type { CommunityTypeMemberRow } from '@/services/community';

const LEVEL_LABEL: Record<string, string> = {
  LEVEL_1: 'Level 1', LEVEL_2: 'Level 2', LEVEL_3: 'Level 3',
  LEVEL_4: 'Level 4', LEVEL_5: 'Level 5',
};

function MemberCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 animate-pulse">
      <div className="h-10 w-10 rounded-full bg-slate-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-32 rounded bg-slate-200" />
        <div className="h-3 w-20 rounded bg-slate-200" />
      </div>
      <div className="h-5 w-14 rounded-full bg-slate-200" />
    </div>
  );
}

interface Props {
  members: CommunityTypeMemberRow[];
  isLoading: boolean;
  isError: boolean;
}

export function CommunityMembersTab({ members, isLoading, isError }: Props) {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? members.filter((m) => {
        const name = `${m.teacher.firstName} ${m.teacher.lastName}`.toLowerCase();
        const subject = (m.teacher.subject ?? '').toLowerCase();
        const q = search.toLowerCase();
        return name.includes(q) || subject.includes(q);
      })
    : members;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#043658]">
          {isLoading ? 'Loading…' : `${members.length} member${members.length !== 1 ? 's' : ''}`}
        </p>
        <div className="relative w-56">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members…"
            aria-label="Search members"
            className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#043658]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#043658]/10"
          />
        </div>
      </div>

      {isLoading && (
        <div className="grid gap-2 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => <MemberCardSkeleton key={i} />)}
        </div>
      )}

      {isError && !isLoading && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          Could not load members. Please try again.
        </p>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <Users className="h-8 w-8 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">
            {search ? 'No members match your search' : 'No members yet'}
          </p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-xs font-medium text-[#043658] hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {filtered.map((m) => {
            const name = `${m.teacher.firstName} ${m.teacher.lastName}`.trim();
            return (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 transition-shadow hover:shadow-sm"
              >
                <Avatar
                  name={name}
                  profileImage={m.teacher.profileImage}
                  size="md"
                  className="shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-[#043658]">{name}</p>
                    {m.teacher.verified && (
                      <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#043658]" />
                    )}
                  </div>
                  {m.teacher.subject && (
                    <p className="truncate text-xs text-slate-500">{m.teacher.subject}</p>
                  )}
                </div>
                <span className="shrink-0 rounded-full bg-[#043658]/8 px-2 py-0.5 text-[10px] font-semibold text-[#043658]">
                  {LEVEL_LABEL[m.teacher.level] ?? m.teacher.level}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
