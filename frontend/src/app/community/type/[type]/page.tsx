'use client';

import { use, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, RefreshCw } from 'lucide-react';

import { DashboardSidebar } from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import {
  useCommunityType,
  useCommunityTypePosts,
  useCommunityTypeMembers,
} from '@/hooks/useCommunityType';
import { CommunityTypeHeader, CommunityTypeHeaderSkeleton } from '@/components/community/CommunityTypeHeader';
import { CommunityTypeRail } from '@/components/community/CommunityTypeRail';
import { CommunityPostComposer } from '@/components/community/CommunityPostComposer';
import { CommunityMembersTab } from '@/components/community/CommunityMembersTab';
import { CommunityAboutTab } from '@/components/community/CommunityAboutTab';
import PostCard from '@/components/post/PostCard';

type Tab = 'posts' | 'members' | 'about';

function PostFeedSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-32 rounded bg-slate-200" />
              <div className="h-3 w-20 rounded bg-slate-200" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-4 w-3/4 rounded bg-slate-200" />
            <div className="h-3 w-full rounded bg-slate-200" />
            <div className="h-3 w-5/6 rounded bg-slate-200" />
          </div>
          <div className="mt-4 flex gap-6">
            <div className="h-3.5 w-12 rounded bg-slate-200" />
            <div className="h-3.5 w-12 rounded bg-slate-200" />
            <div className="h-3.5 w-12 rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface PageProps {
  params: Promise<{ type: string }>;
}

export default function CommunityTypePage({ params }: PageProps) {
  const { type } = use(params);
  const [activeTab, setActiveTab] = useState<Tab>('posts');
  const queryClient = useQueryClient();

  const {
    data: communityData,
    isLoading: communityLoading,
    isError: communityError,
    refetch: refetchCommunity,
  } = useCommunityType(type);

  const {
    data: posts = [],
    isLoading: postsLoading,
    isError: postsError,
    refetch: refetchPosts,
  } = useCommunityTypePosts(type);

  const {
    data: members = [],
    isLoading: membersLoading,
    isError: membersError,
  } = useCommunityTypeMembers(type);

  const community = communityData?.community ?? null;

  if (communityError) {
    return (
      <div className="h-screen overflow-hidden bg-slate-50">
        <DashboardSidebar />
        <Topbar />
        <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <AlertCircle className="h-6 w-6 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">
                Unable to load this community.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                You may not have the required level, or no community of this type has been created yet.
              </p>
            </div>
            <button
              onClick={() => refetchCommunity()}
              className="flex items-center gap-2 rounded-lg bg-[#043658] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#043658]/30"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'posts', label: 'Posts' },
    { id: 'members', label: `Members${community ? ` (${community._count.communityMembers})` : ''}` },
    { id: 'about', label: 'About' },
  ];

  return (
    <div className="h-screen overflow-hidden bg-slate-50">
      <DashboardSidebar />
      <Topbar />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">

          {/* Header */}
          <div className="mb-4">
            {communityLoading || !community
              ? <CommunityTypeHeaderSkeleton />
              : <CommunityTypeHeader community={community} type={type} />
            }
          </div>

          {/* Two-column grid */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_272px]">

            {/* ── Left column ── */}
            <div className="min-w-0 space-y-4">

              {/* Tabs */}
              <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-1 shadow-sm">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#043658]/20 ${
                      activeTab === tab.id
                        ? 'text-[#043658]'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#043658]" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {activeTab === 'posts' && (
                <div className="space-y-4">
                  <CommunityPostComposer />

                  {postsLoading && <PostFeedSkeleton />}

                  {postsError && !postsLoading && (
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
                      <p className="text-sm text-red-600">
                        Could not load posts. Please try again.
                      </p>
                      <button
                        onClick={() => refetchPosts()}
                        className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Retry
                      </button>
                    </div>
                  )}

                  {!postsLoading && !postsError && posts.length === 0 && (
                    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                        <svg className="h-7 w-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">No posts yet</p>
                        <p className="mt-1 max-w-xs text-xs text-slate-400">
                          Be the first teacher to share something with your{' '}
                          {type.toLowerCase()} community.
                        </p>
                      </div>
                      <a
                        href="/community/create"
                        className="rounded-lg bg-[#043658] px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                      >
                        Create Post
                      </a>
                    </div>
                  )}

                  {!postsLoading && !postsError && posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={{
                        ...post,
                        community: post.community ?? undefined,
                        category: post.category ?? undefined,
                        teacher: post.teacher
                          ? {
                              ...post.teacher,
                              profileImage: post.teacher.profileImage ?? undefined,
                            }
                          : undefined,
                        comments: (post.comments ?? []) as Array<unknown>,
                      }}
                      feedMode
                    />
                  ))}
                </div>
              )}

              {activeTab === 'members' && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <CommunityMembersTab
                    members={members}
                    isLoading={membersLoading}
                    isError={membersError}
                  />
                </div>
              )}

              {activeTab === 'about' && community && (
                <CommunityAboutTab community={community} />
              )}

              {activeTab === 'about' && !community && !communityLoading && (
                <p className="text-sm text-slate-400">Community information unavailable.</p>
              )}
            </div>

            {/* ── Right column — sticky ── */}
            <aside className="hidden lg:block">
              <div className="sticky top-0 h-fit">
                <CommunityTypeRail currentType={type} community={community} />
              </div>
            </aside>

          </div>

          {/* Mobile rail — below feed */}
          <div className="mt-4 lg:hidden">
            <CommunityTypeRail currentType={type} community={community} />
          </div>

        </div>
      </main>
    </div>
  );
}
