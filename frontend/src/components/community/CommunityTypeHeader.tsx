'use client';

import Link from 'next/link';
import {
  GraduationCap,
  Building2,
  Globe,
  Users,
  MessageCircle,
  PenSquare,
  MapPin,
} from 'lucide-react';
import type { CommunityTypeData } from '@/services/community';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/context/AuthContext';

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

const LEVEL_ORDER: Record<string, number> = {
  LEVEL_1: 1, LEVEL_2: 2, LEVEL_3: 3, LEVEL_4: 4, LEVEL_5: 5,
};

interface Props {
  community: CommunityTypeData;
  type: string;
}

export function CommunityTypeHeader({ community, type }: Props) {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const Icon = TYPE_ICON[type.toUpperCase()] ?? GraduationCap;
  const label = TYPE_LABEL[type.toUpperCase()] ?? `${type} Community`;

  const locationParts = [community.school, community.woreda, community.zone, community.region]
    .filter(Boolean)
    .slice(0, 2);

  const teacherLevel = profile?.level ?? user?.level ?? 'LEVEL_1';
  const levelNum = LEVEL_ORDER[teacherLevel] ?? 1;

  // Woreda-level teachers (Level 2+) viewing the School community page
  // should see the list of schools in their Woreda, not a non-existent chat.
  const chatHref =
    type.toUpperCase() === 'SCHOOL' && levelNum >= 2
      ? '/community/type/woreda/schools'
      : `/community/type/${type.toLowerCase()}/chat`;

  const chatLabel =
    type.toUpperCase() === 'SCHOOL' && levelNum >= 2
      ? 'School Chats'
      : 'Community Chat';

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#043658]">
          <Icon className="h-5 w-5 text-[#FFC107]" />
        </div>
        <div>
          <h1 className="font-['Lexend'] text-base font-semibold leading-tight text-[#043658]">
            {community.name}
          </h1>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-xs text-slate-500">{label}</span>
            {locationParts.length > 0 && (
              <>
                <span className="text-slate-300">·</span>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {locationParts.join(', ')}
                </span>
              </>
            )}
            <span className="text-slate-300">·</span>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Users className="h-3 w-3 shrink-0" />
              {community._count.communityMembers} members
            </span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Link
          href={chatHref}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-[#043658]/30 hover:bg-slate-50 hover:text-[#043658] focus:outline-none focus:ring-2 focus:ring-[#043658]/30"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{chatLabel}</span>
          <span className="sm:hidden">Chat</span>
        </Link>
        <Link
          href="/community/create"
          className="flex items-center gap-1.5 rounded-lg bg-[#043658] px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#043658]/30"
        >
          <PenSquare className="h-3.5 w-3.5" />
          <span>Create Post</span>
        </Link>
      </div>
    </div>
  );
}

export function CommunityTypeHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-slate-200 shrink-0" />
        <div className="space-y-2">
          <div className="h-4 w-40 rounded bg-slate-200" />
          <div className="h-3 w-56 rounded bg-slate-200" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-8 w-28 rounded-lg bg-slate-200" />
        <div className="h-8 w-24 rounded-lg bg-slate-200" />
      </div>
    </div>
  );
}
