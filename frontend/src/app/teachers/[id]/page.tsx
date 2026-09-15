'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowLeft, BadgeCheck, MapPin, BookOpen, Award, Calendar, AlertTriangle } from 'lucide-react';
import { getTeacherProfile } from '@/services/teachers';
import { DashboardSidebar } from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { Avatar } from '@/components/common/Avatar';
import { format } from 'date-fns';

const LEVEL_LABEL: Record<string, string> = {
  LEVEL_1: 'Level 1',
  LEVEL_2: 'Level 2',
  LEVEL_3: 'Level 3',
  LEVEL_4: 'Level 4',
  LEVEL_5: 'Level 5',
};

export default function TeacherProfilePage() {
  const params = useParams();
  const router = useRouter();
  const teacherId = params.id as string;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['teacher-profile', teacherId],
    queryFn: () => getTeacherProfile(teacherId),
    enabled: !!teacherId,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F8FB]">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#043658]" />
          <p className="mt-3 text-sm text-slate-500">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F8FB]">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Profile not found</h2>
          <p className="mt-1 text-sm text-slate-500">
            This teacher profile could not be loaded.
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#043658] px-4 py-2 text-sm font-semibold text-white hover:bg-[#032B46]"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const name = `${profile.firstName} ${profile.lastName}`.trim();

  return (
    <div className="h-screen overflow-hidden bg-[#F5F8FB]">
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="mt-16 h-[calc(100vh-4rem)] overflow-y-auto lg:ml-64">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#043658]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="space-y-6">
            {/* Profile Header Card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {/* Banner */}
              <div
                className="h-32 bg-gradient-to-br from-[#043658] to-[#0A5A8A]"
                style={
                  profile.bannerUrl
                    ? { backgroundImage: `url(${profile.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : undefined
                }
              />

              {/* Profile Content */}
              <div className="relative px-6 pb-6">
                {/* Avatar */}
                <div className="absolute -top-12 left-6">
                  <Avatar
                    name={name}
                    profileImage={profile.profileImage}
                    size="xl"
                    className="ring-4 ring-white"
                  />
                </div>

                {/* Profile Info */}
                <div className="pt-16">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-[#043658]">{name}</h1>
                        {profile.isVerified && (
                          <BadgeCheck className="h-6 w-6 text-[#043658]" aria-label="Verified Teacher" />
                        )}
                      </div>

                      {/* Level Badge */}
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#043658]/10 px-3 py-1 text-sm font-semibold text-[#043658]">
                        <Award className="h-4 w-4" />
                        {LEVEL_LABEL[profile.level] || profile.level}
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {profile.bio && (
                    <div className="mt-4 rounded-xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-700 leading-relaxed">{profile.bio}</p>
                    </div>
                  )}

                  {/* Info Grid */}
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {profile.school && (
                      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <MapPin className="h-5 w-5 shrink-0 text-slate-400" />
                        <div>
                          <p className="text-xs font-medium text-slate-500">School</p>
                          <p className="mt-0.5 text-sm font-semibold text-slate-900">{profile.school}</p>
                        </div>
                      </div>
                    )}

                    {profile.subject && (
                      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <BookOpen className="h-5 w-5 shrink-0 text-slate-400" />
                        <div>
                          <p className="text-xs font-medium text-slate-500">Subject</p>
                          <p className="mt-0.5 text-sm font-semibold text-slate-900">{profile.subject}</p>
                        </div>
                      </div>
                    )}

                    {profile.department && (
                      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <BookOpen className="h-5 w-5 shrink-0 text-slate-400" />
                        <div>
                          <p className="text-xs font-medium text-slate-500">Department</p>
                          <p className="mt-0.5 text-sm font-semibold text-slate-900">{profile.department}</p>
                        </div>
                      </div>
                    )}

                    {profile.region && (
                      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <MapPin className="h-5 w-5 shrink-0 text-slate-400" />
                        <div>
                          <p className="text-xs font-medium text-slate-500">Region</p>
                          <p className="mt-0.5 text-sm font-semibold text-slate-900">{profile.region}</p>
                        </div>
                      </div>
                    )}

                    {profile.zone && (
                      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <MapPin className="h-5 w-5 shrink-0 text-slate-400" />
                        <div>
                          <p className="text-xs font-medium text-slate-500">Zone</p>
                          <p className="mt-0.5 text-sm font-semibold text-slate-900">{profile.zone}</p>
                        </div>
                      </div>
                    )}

                    {profile.woreda && (
                      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <MapPin className="h-5 w-5 shrink-0 text-slate-400" />
                        <div>
                          <p className="text-xs font-medium text-slate-500">Woreda</p>
                          <p className="mt-0.5 text-sm font-semibold text-slate-900">{profile.woreda}</p>
                        </div>
                      </div>
                    )}

                    {profile.createdAt && (
                      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <Calendar className="h-5 w-5 shrink-0 text-slate-400" />
                        <div>
                          <p className="text-xs font-medium text-slate-500">Member Since</p>
                          <p className="mt-0.5 text-sm font-semibold text-slate-900">
                            {format(new Date(profile.createdAt), 'MMMM yyyy')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            {(profile.postsCount !== undefined || profile.followerCount !== undefined || profile.followingCount !== undefined) && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-[#043658]">Activity</h2>
                <div className="grid grid-cols-3 gap-4">
                  {profile.postsCount !== undefined && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#043658]">{profile.postsCount}</p>
                      <p className="mt-1 text-xs text-slate-500">Posts</p>
                    </div>
                  )}
                  {profile.followerCount !== undefined && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#043658]">{profile.followerCount}</p>
                      <p className="mt-1 text-xs text-slate-500">Followers</p>
                    </div>
                  )}
                  {profile.followingCount !== undefined && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#043658]">{profile.followingCount}</p>
                      <p className="mt-1 text-xs text-slate-500">Following</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Communities Card - Commented out until we have actual community data */}
            {/* {profile.communities && profile.communities.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-[#043658]">Communities</h2>
                <div className="space-y-2">
                  {profile.communities.map((community: any) => (
                    <div
                      key={community.id}
                      className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#043658] text-sm font-bold text-white">
                        {community.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{community.name}</p>
                        <p className="text-xs text-slate-500">{community.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )} */}
          </div>
        </div>
      </main>
    </div>
  );
}
