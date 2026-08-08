import { GraduationCap, Building2, Globe, Lock, LucideIcon } from 'lucide-react';

interface Tier {
  id: string;
  icon: LucideIcon;
  name: string;
  unlocked: boolean;
}

const TIERS: Tier[] = [
  { id: '1', icon: GraduationCap, name: 'School Community', unlocked: true },
  { id: '2', icon: Building2, name: 'Woreda Network', unlocked: true },
  { id: '3', icon: Globe, name: 'Regional Hub', unlocked: false },
];

export function CommunityAccessListCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-['Lexend'] font-semibold text-[#043658] text-sm mb-3">Community Access</h3>
      <div className="space-y-2">
        {TIERS.map((tier) => (
          <div key={tier.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50 transition-colors">
            <div className="h-9 w-9 rounded-lg bg-[#043658]/8 flex items-center justify-center shrink-0">
              <tier.icon className="h-4 w-4 text-[#043658]" />
            </div>
            <p className="flex-1 text-sm font-medium text-[#043658]">{tier.name}</p>
            {tier.unlocked ? (
              <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">
                UNLOCKED
              </span>
            ) : (
              <Lock className="h-3.5 w-3.5 text-slate-300" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
