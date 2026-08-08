"use client";

import { BadgeCheck, Search, Users } from "lucide-react";
import { useState } from "react";

interface Member {
  id: string;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    level: string;
    school: string;
    subject?: string;
    profileImage?: string;
    verified?: boolean;
  };
}

interface Props {
  members: Member[];
  title?: string;
  isLoading?: boolean;
}

const LEVEL_LABEL: Record<string, string> = {
  LEVEL_1: "Level 1",
  LEVEL_2: "Level 2",
  LEVEL_3: "Level 3",
  LEVEL_4: "Level 4",
  LEVEL_5: "Level 5",
};

export default function TeacherDirectory({ members, title = "Teachers Directory", isLoading }: Props) {
  const [search, setSearch] = useState("");

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    const t = m.teacher;
    return (
      `${t.firstName} ${t.lastName}`.toLowerCase().includes(q) ||
      t.school?.toLowerCase().includes(q) ||
      t.subject?.toLowerCase().includes(q) ||
      t.level?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="rounded-[28px] bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <Users className="h-5 w-5 text-[#043658]" />
        <h2 className="font-['Lexend'] text-sm font-semibold text-[#043658]">{title}</h2>
        <span className="ml-auto rounded-full bg-[#043658]/8 px-2.5 py-0.5 text-xs font-semibold text-[#043658]">
          {members.length}
        </span>
      </div>

      {/* inline search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          id="teacher-directory-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search teachers…"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-[#043658] outline-none transition focus:border-[#043658]"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-3 animate-pulse">
              <div className="h-10 w-10 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-1/2 rounded bg-slate-200" />
                <div className="h-2 w-1/3 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-4 text-center text-xs text-slate-400">No teachers match your search.</p>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {filtered.map((m) => {
            const t = m.teacher;
            const initials = `${t.firstName.charAt(0)}${t.lastName.charAt(0)}`.toUpperCase();
            return (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 transition hover:border-[#043658]/20 hover:bg-white"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#043658] text-sm font-semibold text-white">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-[#043658]">
                      {t.firstName} {t.lastName}
                    </p>
                    {t.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#FFC107]" />}
                  </div>
                  <p className="truncate text-xs text-slate-500">
                    {LEVEL_LABEL[t.level] ?? t.level} · {t.school}
                  </p>
                  {t.subject && (
                    <p className="truncate text-[10px] text-slate-400">{t.subject}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
