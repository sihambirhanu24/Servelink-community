'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
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
  MapPin,
} from 'lucide-react';
import api from '@/lib/axios';
import { Avatar } from '@/components/common/Avatar';

const LEVEL_ORDER: Record<string, number> = {
  LEVEL_1: 1,
  LEVEL_2: 2,
  LEVEL_3: 3,
  LEVEL_4: 4,
  LEVEL_5: 5,
};

const TYPE_MIN_LEVEL: Record<string, number> = {
  SCHOOL: 1,
  WOREDA: 2,
  ZONE: 3,
  REGION: 4,
  NATIONAL: 5,
};

const TYPE_LABEL: Record<string, string> = {
  SCHOOL: 'School Community',
  WOREDA: 'Woreda Community',
  ZONE: 'Zone Community',
  REGION: 'Regional Community',
  NATIONAL: 'National Community',
};

const TYPE_ICON: Record<string, React.ElementType> = {
  SCHOOL: GraduationCap,
  WOREDA: Building2,
  ZONE: Building2,
  REGION: Globe,
  NATIONAL: Globe,
};

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  level: string;
  profileImage?: string | null;
  school: string;
  woreda: string;
  subject?: string | null;
}

interface MembershipItem {
  communityId: string;
  status: string;
  community: {
    id: string;
    name: string;
    type: string;
    description?: string | null;
  };
}

async function fetchTeacher(): Promise<Teacher> {
  const { data } = await api.get('/profile/me');
  return data;
}

async function fetchMyCommunities(): Promise<MembershipItem[]> {
  const { data } = await api.get('/profile/communities');
  return Array.isArray(data) ? data : data?.communities ?? [];
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
      {children}
    </p>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CommunitySideRail() {
  const { data: teacher, isLoading: teacherLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchTeacher,
    staleTime: 60_000,
  });

  const { data: memberships = [], isLoading: membershipsLoading } = useQuery({
    queryKey: ['my-communities-count'],
    queryFn: fetchMyCommunities,
    staleTime: 30_000,
  });

  const teacherLevel = teacher?.level ?? 'LEVEL_1';
  const teacherLevelNum = LEVEL_ORDER[teacherLevel] ?? 1;
  const totalLevels = 5;
  const progressPercent = Math.round((teacherLevelNum / totalLevels) * 100);
  const levelLabel = teacherLevel.replace('_', ' ');

  const communityTypes = ['SCHOOL', 'WOREDA', 'ZONE', 'REGION', 'NATIONAL'] as const;

  const joinedIds = new Set(memberships.map((m) => m.community?.id).filter(Boolean));

  const activeMemberships = memberships.filter(
    (m) => m.community && joinedIds.has(m.community.id),
  );

  const userName = teacher
    ? `${teacher.firstName} ${teacher.lastName}`.trim()
    : '';

  return (
    <div className="space-y-3">
      {/* ── Community Access ── */}
      <Card>
        <SectionHeading>Community Access</SectionHeading>
        {teacherLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2 animate-pulse">
                <div className="h-5 w-5 rounded-full bg-slate-200 shrink-0" />
                <div className="h-3 flex-1 rounded bg-slate-200" />
                <div className="h-3 w-14 rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {communityTypes
              .filter((type) => teacherLevelNum >= (TYPE_MIN_LEVEL[type] ?? 99))
              .map((type, i, arr) => {
                const Icon = TYPE_ICON[type];
                const isLast = i === arr.length - 1;

                return (
                  <div key={type} className="flex items-center gap-2.5">
                    <div className="relative flex shrink-0 flex-col items-center">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#043658]">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                      {!isLast && (
                        <div className="mt-0.5 h-3.5 w-px bg-[#043658]/25" />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 items-center justify-between">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <Icon className="h-3 w-3 shrink-0 text-[#043658]" />
                        <span className="truncate text-xs font-medium text-[#043658]">
                          {TYPE_LABEL[type]}
                        </span>
                      </div>
                      <span className="ml-2 shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-700">
                        Available
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </Card>

      {/* ── Level Progress ── */}
      <Card>
        <SectionHeading>Level Progress</SectionHeading>
        {teacherLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 w-20 rounded bg-slate-200" />
            <div className="h-2 w-full rounded-full bg-slate-200" />
            <div className="h-3 w-32 rounded bg-slate-200" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#043658]">
                {levelLabel}
              </span>
              <span className="text-xs font-semibold text-[#043658]">
                {progressPercent}%
              </span>
            </div>

            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#FFC107] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>

            {teacherLevelNum < totalLevels ? (
              <p className="mt-1.5 text-[11px] text-slate-400">
                {teacherLevelNum} of {totalLevels} levels reached
              </p>
            ) : (
              <p className="mt-1.5 text-[11px] font-semibold text-[#043658]">
                Maximum level reached
              </p>
            )}

            {teacher?.subject && (
              <p className="mt-1 text-[11px] text-slate-500 truncate">
                {teacher.subject}
              </p>
            )}
          </>
        )}
      </Card>

      {/* ── My Communities ── */}
      <Card>
        <div className="flex items-center justify-between">
          <SectionHeading>My Communities</SectionHeading>
          <Link
            href="/community/my-communities"
            className="mb-2.5 text-[10px] font-semibold text-[#043658] hover:underline focus:outline-none"
          >
            View all
          </Link>
        </div>

        {membershipsLoading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-3/4 rounded bg-slate-200" />
                  <div className="h-2.5 w-1/2 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : activeMemberships.length === 0 ? (
          <div className="py-3 text-center">
            <Users className="mx-auto h-6 w-6 text-slate-300" />
            <p className="mt-1.5 text-xs text-slate-400">
              No communities joined yet
            </p>
            <Link
              href="/community"
              className="mt-2 inline-block text-xs font-semibold text-[#043658] hover:underline"
            >
              Explore →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {activeMemberships.slice(0, 3).map((m) => {
              const Icon = TYPE_ICON[m.community.type] ?? Building2;
              return (
                <Link
                  key={m.community.id}
                  href={`/community/${m.community.id}`}
                  className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#043658]/20"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#043658]/8">
                    <Icon className="h-3.5 w-3.5 text-[#043658]" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-[#043658] leading-tight">
                      {m.community.name}
                    </p>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {TYPE_LABEL[m.community.type] ?? m.community.type}
                    </p>
                  </div>
                </Link>
              );
            })}

            {activeMemberships.length > 3 && (
              <Link
                href="/community/my-communities"
                className="flex items-center gap-1 pl-1.5 text-xs font-medium text-[#043658] hover:underline focus:outline-none"
              >
                +{activeMemberships.length - 3} more
                <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        )}
      </Card>

      {/* ── Quick Actions ── */}
      <Card>
        <SectionHeading>Quick Actions</SectionHeading>
        <div className="space-y-1">
          <Link
            href="/bookmarks"
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#043658] focus:outline-none focus:ring-2 focus:ring-[#043658]/20"
          >
            <Bookmark className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            My Bookmarks
          </Link>
          <Link
            href="/profile/posts"
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#043658] focus:outline-none focus:ring-2 focus:ring-[#043658]/20"
          >
            <FileText className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            My Posts
          </Link>
        </div>
      </Card>
    </div>
  );
}
