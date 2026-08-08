"use client";

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import PostCard from '@/components/post/PostCard';
import { memo } from 'react';

async function getRecentPosts() {
  const { data } = await api.get('/community/posts?limit=5');
  return data;
}

const MemoizedPostCard = memo(PostCard);

function PostSkeleton() {
  return (
    <div className="animate-pulse rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 shrink-0 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-3 py-1">
          <div className="h-4 w-1/3 rounded bg-slate-200" />
          <div className="h-3 w-1/4 rounded bg-slate-200" />
        </div>
      </div>
      <div className="mt-5 space-y-3">
        <div className="h-4 w-3/4 rounded bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-200" />
        <div className="h-4 w-5/6 rounded bg-slate-200" />
      </div>
      <div className="mt-6 flex gap-4">
        <div className="h-4 w-12 rounded bg-slate-200" />
        <div className="h-4 w-12 rounded bg-slate-200" />
        <div className="h-4 w-12 rounded bg-slate-200" />
      </div>
    </div>
  );
}

export function LatestActivityCard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: getRecentPosts,
  });

  const posts = data ?? [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-['Lexend'] text-sm font-semibold text-[#043658]">Latest Activity</h3>
        <Link href="/posts" className="text-xs font-medium text-[#043658] transition hover:text-[#032742] hover:underline">
          View All Feed
        </Link>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : null}
        
        {isError ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            We could not load the latest activity right now. Please try again.
          </p>
        ) : null}

        {!isLoading && !isError && posts.length === 0 ? (
          <p className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            No activity yet. Be the first to share something!
          </p>
        ) : null}

        {!isLoading && !isError && posts.map((post: any) => (
          <MemoizedPostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
