'use client';

import { Calendar, MessageCircle, CheckCircle2, FileText, LucideIcon } from 'lucide-react';

export interface NotificationItemData {
  id: string;
  icon: 'meeting' | 'comment' | 'system' | 'update';
  title: string;
  description: string;
  timeAgo: string;
  priority?: 'high';
  actions?: 'accept-decline' | 'view-comment' | 'download-report';
}

const ICON_MAP: Record<NotificationItemData['icon'], { Icon: LucideIcon; bg: string; color: string }> = {
  meeting: { Icon: Calendar, bg: 'bg-[#FFC107]/15', color: 'text-[#926E00]' },
  comment: { Icon: MessageCircle, bg: 'bg-blue-50', color: 'text-blue-600' },
  system: { Icon: CheckCircle2, bg: 'bg-emerald-50', color: 'text-emerald-600' },
  update: { Icon: FileText, bg: 'bg-slate-100', color: 'text-slate-600' },
};

export function NotificationItem({ item }: { item: NotificationItemData }) {
  const { Icon, bg, color } = ICON_MAP[item.icon];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className={`h-9 w-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-[#043658]">{item.title}</p>
            <div className="flex items-center gap-2 shrink-0">
              {item.priority === 'high' && (
                <span className="rounded-full bg-red-50 text-red-600 text-[10px] font-semibold px-2 py-0.5">
                  HIGH PRIORITY
                </span>
              )}
              <span className="text-xs text-slate-400">{item.timeAgo}</span>
            </div>
          </div>
          <p className="mt-1 text-sm text-slate-500 leading-relaxed">{item.description}</p>

          {item.actions === 'accept-decline' && (
            <div className="mt-3 flex gap-2">
              <button className="rounded-lg bg-[#043658] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#043658]/90 transition-colors">
                Accept
              </button>
              <button className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                Decline
              </button>
            </div>
          )}
          {item.actions === 'view-comment' && (
            <button className="mt-1.5 text-xs font-medium text-[#043658] hover:underline">
              View comment
            </button>
          )}
          {item.actions === 'download-report' && (
            <button className="mt-1.5 text-xs font-medium text-[#043658] hover:underline">
              Download PDF Report →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
