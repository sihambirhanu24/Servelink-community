'use client';

import Link from 'next/link';
import {
  GraduationCap,
  Building2,
  Globe,
  CheckCircle2,
  Users,
  PenSquare,
  Bookmark,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import type { CommunityTypeData } from '@/services/community';

const LEVEL_ORDER: Record<string, number> = {
  LEVEL_1: 1, LEVEL_2: 2, LEVEL_3: 3, LEVEL_4: 4, LEVEL_5: 5,
};
const TYPE_MIN_LEVEL: Record<string, number> = {
  SCHOOL: 1, WOREDA: 2, ZONE: 3, REGION: 4, NATIONAL: 5,
};
const TYPE_LABEL: Record<string, string> = {
  SCHOOL: 'School',
  WOREDA: 'Woreda',
  ZONE: 'Zone',
  REGION: 'Regional',
  NATIONAL: 'National',
};
const TYPE_ROUTE: Record<string, string> = {
  SCHOOL: '/community/type/school',
  WOREDA: '/community/type/woreda',
  ZONE: '/community/type/zone',
  REGION: '/community/type/region',
  NATIONAL: '/community/type/national',
};
const TYPE_ICON: Record<string, React.ElementType> = {
  SCHOOL: GraduationCap,
  WOREDA: Building2,
  ZONE: Building2,
  REGION: Globe,
  NATIONAL: Globe,
};

interface Props {
  currentType: string;
  community: CommunityTypeData | null;
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
      {children}
    </p>
  );
}

export function CommunityTypeRail({ currentType, community }: Props) {
  const { data: profile, isLoading } = useProfile();
  const teacherLevel = profile?.level ?? 'LEVEL_1';
  const teacherLevelNum = LEVEL_ORDER[teacherLevel] ?? 1;
  const types = ['SCHOOL', 'WOREDA', 'ZONE', 'REGION', 'NATIONAL'] as const;

  return (
    <div className="space-y-3">
      {/* Community stats */}
      {community && (
        <Card>
          <Heading>Community</Heading>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#043658]">
              <GraduationCap className="h-4 w-4 text-[#FFC107]" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#043658]">
                {community.name}
              </p>
              <p className="text-[10px] text-slate-400">
                {TYPE_LABEL[community.type] ?? community.type} Community
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-center">
              <p className="text-base font-bold text-[#043658]">
                {community._count.communityMembers}
              </p>
              <p className="text-[10px] text-slate-400">Members</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-center">
              <p className="text-base font-bold text-[#043658]">
                {community._count.posts}
              </p>
              <p className="text-[10px] text-slate-400">Posts</p>
            </div>
          </div>
        </Card>
      )}

      {/* Community Access */}
      <Card>
        <Heading>Community Access</Heading>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2 animate-pulse">
                <div className="h-5 w-5 rounded-full bg-slate-200 shrink-0" />
                <div className="h-3 flex-1 rounded bg-slate-200" />
                <div className="h-3 w-12 rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {types
              .filter((type) => teacherLevelNum >= (TYPE_MIN_LEVEL[type] ?? 99))
              .map((type, i, arr) => {
                const isCurrent = type === currentType.toUpperCase();
                const Icon = TYPE_ICON[type];
                const isLast = i === arr.length - 1;

                const row = (
                  <div className={`flex items-center gap-2.5 rounded-lg px-1.5 py-1 ${isCurrent ? 'bg-[#043658]/8' : ''}`}>
                    <div className="relative flex shrink-0 flex-col items-center">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#043658]">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                      {!isLast && (
                        <div className="mt-0.5 h-3 w-px bg-[#043658]/25" />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-1">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <Icon className="h-3 w-3 shrink-0 text-[#043658]" />
                        <span className={`truncate text-xs ${isCurrent ? 'font-semibold text-[#043658]' : 'font-medium text-[#043658]'}`}>
                          {TYPE_LABEL[type]}
                        </span>
                      </div>
                      {isCurrent ? (
                        <span className="shrink-0 rounded-full bg-[#FFC107]/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#7a5900]">
                          Current
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-700">
                          Available
                        </span>
                      )}
                    </div>
                  </div>
                );

                return (
                  <div key={type}>
                    {!isCurrent ? (
                      <Link href={TYPE_ROUTE[type]} className="block focus:outline-none focus:ring-2 focus:ring-[#043658]/20 rounded-lg">
                        {row}
                      </Link>
                    ) : (
                      row
                    )}
                  </div>
                );
              })}
          </div>
        )}
        {!isLoading && (
          <p className="mt-3 border-t border-slate-100 pt-3 text-[10px] text-slate-400">
            Your level: <span className="font-semibold text-[#043658]">{teacherLevel.replace('_', ' ')}</span>
          </p>
        )}
      </Card>

      {/* Quick Actions */}
      <Card>
        <Heading>Quick Actions</Heading>
        <div className="space-y-0.5">
          {[
            { href: '/posts', icon: PenSquare, label: 'Create Post', accent: true },
            { href: '/bookmarks', icon: Bookmark, label: 'My Bookmarks', accent: false },
            { href: '/profile/posts', icon: FileText, label: 'My Posts', accent: false },
            { href: '/community/my-communities', icon: Users, label: 'My Communities', accent: false },
          ].map(({ href, icon: Icon, label, accent }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#043658]/20 ${
                accent
                  ? 'text-[#043658] hover:bg-[#FFC107]/10'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-[#043658]'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 shrink-0 ${accent ? 'text-[#043658]' : 'text-slate-400'}`} />
              {label}
              {accent && <ChevronRight className="ml-auto h-3 w-3 text-slate-300" />}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
