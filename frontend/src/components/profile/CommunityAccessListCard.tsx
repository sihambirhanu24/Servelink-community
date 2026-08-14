import { GraduationCap, Building2, Globe, MapPin, Flag, Lock, LucideIcon } from 'lucide-react';

interface CommunityAccessLevel {
  type: string;
  unlocked: boolean;
  required: number;
  joined: number;
  available: number;
}

interface Props {
  communityAccess?: CommunityAccessLevel[];
}

const TYPE_ICONS: Record<string, LucideIcon> = {
  SCHOOL: GraduationCap,
  WOREDA: Building2,
  ZONE: MapPin,
  REGION: Globe,
  NATIONAL: Flag,
};

const TYPE_LABELS: Record<string, string> = {
  SCHOOL: 'School Community',
  WOREDA: 'Woreda Network',
  ZONE: 'Zone Network',
  REGION: 'Regional Hub',
  NATIONAL: 'National Network',
};

export function CommunityAccessListCard({ communityAccess }: Props) {
  // Fallback to default data if none provided
  const tiers = communityAccess || [
    { type: 'SCHOOL', unlocked: true, required: 1, joined: 0, available: 1 },
    { type: 'WOREDA', unlocked: false, required: 2, joined: 0, available: 0 },
    { type: 'ZONE', unlocked: false, required: 3, joined: 0, available: 0 },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-['Lexend'] font-semibold text-[#043658] text-sm mb-3">Community Access</h3>
      <div className="space-y-2">
        {tiers.map((tier) => {
          const Icon = TYPE_ICONS[tier.type] || GraduationCap;
          const label = TYPE_LABELS[tier.type] || tier.type;
          
          return (
            <div key={tier.type} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50 transition-colors">
              <div className="h-9 w-9 rounded-lg bg-[#043658]/8 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-[#043658]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#043658]">{label}</p>
                {tier.unlocked && tier.joined > 0 && (
                  <p className="text-[10px] text-slate-400">{tier.joined} joined</p>
                )}
              </div>
              {tier.unlocked ? (
                <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">
                  UNLOCKED
                </span>
              ) : (
                <div className="flex items-center gap-1">
                  <Lock className="h-3 w-3 text-slate-300" />
                  <span className="text-[9px] text-slate-400">Level {tier.required}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
