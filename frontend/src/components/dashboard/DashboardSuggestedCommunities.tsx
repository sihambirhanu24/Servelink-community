'use client';

import { Users, GraduationCap, Building2, Globe, Loader2 } from 'lucide-react';
import { useJoinCommunityFromDashboard } from '@/hooks/useDashboard';
import type { DashboardSuggestedCommunity } from '@/types/dashboard';

const TYPE_ICON: Record<string, React.ElementType> = {
  SCHOOL: GraduationCap,
  WOREDA: Building2,
  ZONE: Building2,
  REGION: Globe,
  NATIONAL: Globe,
};

const TYPE_LABEL: Record<string, string> = {
  SCHOOL: 'School',
  WOREDA: 'Woreda',
  ZONE: 'Zone',
  REGION: 'Regional',
  NATIONAL: 'National',
};

interface Props {
  communities: DashboardSuggestedCommunity[];
}

export function DashboardSuggestedCommunities({ communities }: Props) {
  const { mutate: join, isPending, variables } = useJoinCommunityFromDashboard();

  if (communities.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-[#043658]">Suggested Communities</h2>
        <p className="mt-0.5 text-xs text-slate-400">Communities you can join</p>
      </div>

      <ul className="divide-y divide-slate-100">
        {communities.map((c) => {
          const Icon = TYPE_ICON[c.type] ?? Building2;
          const isJoining = isPending && variables === c.id;

          return (
            <li key={c.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#043658]/8">
                <Icon className="h-4 w-4 text-[#043658]" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-[#043658]">
                  {c.name}
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="rounded-full bg-slate-100 px-1.5 py-0.5 font-medium">
                    {TYPE_LABEL[c.type]}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Users className="h-2.5 w-2.5" />
                    {c._count.communityMembers}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => join(c.id)}
                disabled={isPending}
                aria-label={`Join ${c.name}`}
                className="shrink-0 rounded-lg border border-[#043658] px-3 py-1.5 text-xs font-semibold text-[#043658] transition-colors hover:bg-[#043658] hover:text-white disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#043658]/30"
              >
                {isJoining ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  'Join'
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
