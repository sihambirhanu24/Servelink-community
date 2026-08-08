"use client";

import { AlertTriangle, BookOpen, Pin } from "lucide-react";

export interface Announcement {
  id: string;
  title: string;
  date: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  excerpt?: string;
}

interface Props {
  announcements: Announcement[];
  title?: string;
}

const PRIORITY_STYLES: Record<Announcement["priority"], { label: string; cls: string }> = {
  HIGH: { label: "High Priority", cls: "bg-red-100 text-red-700" },
  MEDIUM: { label: "Medium", cls: "bg-amber-100 text-amber-700" },
  LOW: { label: "Info", cls: "bg-blue-100 text-blue-700" },
};

export default function OfficialAnnouncements({ announcements, title = "Official Announcements" }: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Pin className="h-4 w-4 text-[#043658]" />
        <h3 className="text-sm font-semibold text-[#043658]">{title}</h3>
      </div>

      {announcements.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4">No announcements yet.</p>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => {
            const p = PRIORITY_STYLES[ann.priority];
            return (
              <div
                key={ann.id}
                className="rounded-xl border border-slate-100 bg-slate-50 p-3 transition hover:border-[#043658]/20 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-[#043658] leading-snug">{ann.title}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.cls}`}>
                    {p.label}
                  </span>
                </div>
                {ann.excerpt && (
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500 line-clamp-2">{ann.excerpt}</p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">{ann.date}</span>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-[10px] font-semibold text-[#043658] hover:underline"
                  >
                    <BookOpen className="h-3 w-3" />
                    Read more
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
