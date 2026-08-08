import { Award, Users, UploadCloud, LucideIcon } from 'lucide-react';

interface ActivityItem {
  id: string;
  icon: LucideIcon;
  color: string;
  message: string;
  dateLabel: string;
}

const MOCK_ACTIVITY: ActivityItem[] = [
  { id: '1', icon: Award, color: 'text-[#FFC107]', message: 'Earned Level 2 Educator', dateLabel: 'Yesterday, 14:20 PM' },
  { id: '2', icon: Users, color: 'text-blue-500', message: 'Joined Woreda Network', dateLabel: 'Oct 24, 2023' },
  { id: '3', icon: UploadCloud, color: 'text-emerald-500', message: 'Uploaded Calculus Guide PDF', dateLabel: 'Oct 20, 2023' },
];

export function RecentActivityCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-['Lexend'] font-semibold text-[#043658] text-sm mb-3">Recent Activity</h3>
      <div className="space-y-3">
        {MOCK_ACTIVITY.map((item) => (
          <div key={item.id} className="flex items-start gap-2.5">
            <item.icon className={`h-4 w-4 mt-0.5 shrink-0 ${item.color}`} />
            <div>
              <p className="text-sm font-medium text-[#043658] leading-tight">{item.message}</p>
              <p className="text-xs text-slate-400 mt-0.5">{item.dateLabel}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
