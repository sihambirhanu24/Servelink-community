'use client';

import { GraduationCap, CheckCircle2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { DashboardTeacher, DashboardCommunityAccessTier } from '@/types/dashboard';

const TYPE_ROUTES: Record<string, string> = {
  SCHOOL: '/community/type/school',
  WOREDA: '/community/type/woreda',
  ZONE: '/community/type/zone',
  REGION: '/community/type/region',
  NATIONAL: '/community/type/national',
};

const LEVEL_META: Record<string, { label: string; order: number }> = {
  LEVEL_1: { label: 'Level 1', order: 1 },
  LEVEL_2: { label: 'Level 2', order: 2 },
  LEVEL_3: { label: 'Level 3', order: 3 },
  LEVEL_4: { label: 'Level 4', order: 4 },
  LEVEL_5: { label: 'Level 5', order: 5 },
};

const TYPE_LABELS: Record<string, string> = {
  SCHOOL: 'School Community',
  WOREDA: 'Woreda Community',
  ZONE: 'Zone Community',
  REGION: 'Regional Community',
  NATIONAL: 'National Community',
};

interface Props {
  teacher: DashboardTeacher;
  communityAccess: DashboardCommunityAccessTier[];
}

export function DashboardLevelCard({ teacher, communityAccess }: Props) {
  const meta = LEVEL_META[teacher.level] ?? LEVEL_META['LEVEL_1'];
  const totalLevels = 5;
  const progressPercent = Math.round((meta.order / totalLevels) * 100);

  const unlockedTiers = communityAccess.filter((t) => t.unlocked);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#043658]">
            <GraduationCap className="h-5 w-5 text-[#FFC107]" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Teacher Progress
            </p>
            <p className="text-lg font-bold leading-tight text-[#043658]">
              {teacher.firstName} {teacher.lastName}
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-[#043658] px-3 py-1 text-xs font-bold tracking-wide text-[#FFC107]">
          {meta.label.toUpperCase()}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs text-slate-500">{meta.label} of {totalLevels}</span>
          <span className="text-xs font-semibold text-[#043658]">{progressPercent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#FFC107] transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        {meta.order >= totalLevels && (
          <p className="mt-1.5 text-xs font-semibold text-[#043658]">
            Maximum level reached — all communities unlocked
          </p>
        )}
      </div>

      {/* Community Access — only unlocked tiers */}
      {unlockedTiers.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Community Access
          </p>
          <div className="space-y-1.5">
            {unlockedTiers.map((tier, i) => {
              const isLast = i === unlockedTiers.length - 1;
              return (
                <div key={tier.type} className="flex items-center gap-2.5">
                  <div className="relative flex shrink-0 flex-col items-center">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#043658]">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </div>
                    {!isLast && (
                      <div className="mt-0.5 h-4 w-px bg-[#043658]/30" />
                    )}
                  </div>
                  <div className="flex flex-1 items-center justify-between min-w-0">
                    <Link
                      href={TYPE_ROUTES[tier.type] ?? '/community'}
                      className="text-xs font-medium text-[#043658] underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-[#043658]/30 rounded"
                    >
                      {TYPE_LABELS[tier.type]}
                    </Link>
                    <span className="shrink-0 text-[10px] text-slate-400">
                      {tier.joined}/{tier.available} joined
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Link
        href="/profile"
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-[#043658] transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#043658]/30"
      >
        View Profile <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
