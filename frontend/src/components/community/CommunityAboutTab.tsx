'use client';

import { GraduationCap, Users, Calendar, MapPin, Info } from 'lucide-react';
import type { CommunityTypeData } from '@/services/community';

interface Props {
  community: CommunityTypeData;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="w-28 shrink-0 text-xs font-medium text-slate-400">{label}</span>
      <span className="flex-1 text-sm text-[#043658]">{value}</span>
    </div>
  );
}

export function CommunityAboutTab({ community }: Props) {
  const locationFields: { label: string; value?: string | null }[] = [
    { label: 'School', value: community.school },
    { label: 'Woreda', value: community.woreda },
    { label: 'Zone', value: community.zone },
    { label: 'Region', value: community.region },
  ].filter((f) => f.value);

  return (
    <div className="max-w-2xl space-y-4">
      {/* Overview */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Info className="h-4 w-4 text-[#043658]" />
          <h2 className="text-sm font-semibold text-[#043658]">Overview</h2>
        </div>
        <div className="divide-y divide-slate-100">
          <Row label="Name" value={community.name} />
          <Row
            label="Type"
            value={
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#043658]/8 px-2.5 py-0.5 text-xs font-semibold text-[#043658]">
                <GraduationCap className="h-3 w-3" />
                {community.type}
              </span>
            }
          />
          {community.description && (
            <Row label="Description" value={community.description} />
          )}
          <Row
            label="Members"
            value={
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                {community._count.communityMembers} member{community._count.communityMembers !== 1 ? 's' : ''}
              </span>
            }
          />
          <Row label="Posts" value={`${community._count.posts} post${community._count.posts !== 1 ? 's' : ''}`} />
          <Row
            label="Created"
            value={
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                {new Date(community.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </span>
            }
          />
        </div>
      </div>

      {/* Location */}
      {locationFields.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#043658]" />
            <h2 className="text-sm font-semibold text-[#043658]">Location</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {locationFields.map(({ label, value }) => (
              <Row key={label} label={label} value={value as string} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
