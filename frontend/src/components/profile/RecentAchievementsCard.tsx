import { ShieldCheck, GraduationCap, Heart, LucideIcon } from 'lucide-react';

interface Achievement {
  id: string;
  icon: LucideIcon;
  label: string;
  dateLabel: string;
}

const MOCK_ACHIEVEMENTS: Achievement[] = [
  { id: '1', icon: ShieldCheck, label: 'Verified Hub', dateLabel: 'Oct 12, 2023' },
  { id: '2', icon: GraduationCap, label: 'STEM Mentor', dateLabel: 'Nov 04, 2023' },
  { id: '3', icon: Heart, label: '100 Likes', dateLabel: 'Aug 20, 2023' },
];

export function RecentAchievementsCard() {
  return (
    <div>
      <h3 className="font-['Lexend'] font-semibold text-[#043658] text-sm mb-3">Recent Achievements</h3>
      <div className="flex flex-wrap gap-3">
        {MOCK_ACHIEVEMENTS.map((a) => (
          <div key={a.id} className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm">
            <div className="h-8 w-8 rounded-lg bg-[#FFC107]/15 flex items-center justify-center shrink-0">
              <a.icon className="h-4 w-4 text-[#926E00]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#043658] leading-tight">{a.label}</p>
              <p className="text-xs text-slate-400 leading-tight">{a.dateLabel}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
