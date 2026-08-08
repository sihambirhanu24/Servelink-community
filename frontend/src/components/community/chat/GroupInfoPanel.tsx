'use client';

import { useState } from 'react';
import { Bell, Star, LogOut } from 'lucide-react';

interface GroupInfoPanelProps {
  initials: string;
  name: string;
  foundedLabel: string;
  about: string;
  mediaCount: number;
  activeMembers: { id: string; name: string; roleLabel: string }[];
}

export function GroupInfoPanel({
  initials,
  name,
  foundedLabel,
  about,
  mediaCount,
  activeMembers,
}: GroupInfoPanelProps) {
  const [muted, setMuted] = useState(true);

  return (
    <div className="w-72 shrink-0 border-l border-slate-200 bg-white p-5 overflow-y-auto">
      <div className="flex flex-col items-center text-center">
        <div className="h-16 w-16 rounded-2xl bg-[#FFC107] flex items-center justify-center text-[#043658] text-lg font-semibold">
          {initials}
        </div>
        <p className="mt-3 font-['Lexend'] font-semibold text-[#043658] text-sm">{name}</p>
        <p className="text-xs text-slate-400">{foundedLabel}</p>
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">About</p>
        <p className="text-xs text-slate-500 leading-relaxed">{about}</p>
      </div>

      <div className="mt-5 space-y-1">
        <div className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-slate-50">
          <span className="flex items-center gap-2 text-sm text-slate-600">
            <Bell className="h-4 w-4" /> Mute Notifications
          </span>
          <button
            onClick={() => setMuted((m) => !m)}
            className={`h-5 w-9 rounded-full transition-colors relative ${muted ? 'bg-[#FFC107]' : 'bg-slate-200'}`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${muted ? 'left-4' : 'left-0.5'}`}
            />
          </button>
        </div>
        <button className="flex items-center gap-2 text-sm text-slate-600 rounded-lg px-2 py-2 hover:bg-slate-50 w-full text-left">
          <Star className="h-4 w-4" /> Pinned Messages
        </button>
        <button className="flex items-center gap-2 text-sm text-red-500 rounded-lg px-2 py-2 hover:bg-red-50 w-full text-left">
          <LogOut className="h-4 w-4" /> Leave Group
        </button>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Shared Media</p>
          <button className="text-xs font-medium text-[#043658] hover:underline">View All</button>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-gradient-to-br from-slate-200 to-slate-300" />
          ))}
          <div className="aspect-square rounded-lg bg-[#043658]/8 flex items-center justify-center text-xs font-semibold text-[#043658]">
            +{mediaCount}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
          Active Members
        </p>
        <div className="space-y-2">
          {activeMembers.map((member) => (
            <div key={member.id} className="flex items-center gap-2.5">
              <div className="relative shrink-0">
                <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-[#043658] text-[10px] font-semibold">
                  {member.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#FFC107] ring-2 ring-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#043658] truncate">{member.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{member.roleLabel}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
