"use client";

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Filter, Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import { getCategories, getCommunities, getPosts } from '@/services/community';
import PostCard from '@/components/post/PostCard';
import { DashboardSidebar } from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

export default function CommunityPostsPage() {
  const [search, setSearch] = useState('');
  const [communityId, setCommunityId] = useState('all');
  const [categoryId, setCategoryId] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'most-likes'>('newest');

  const communitiesQuery = useQuery({ queryKey: ['communities'], queryFn: getCommunities });
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const postsQuery = useQuery({
    queryKey: ['community-feed', search, communityId, categoryId, sortOrder],
    queryFn: () => getPosts({
      search: search || undefined,
      communityId: communityId === 'all' ? undefined : communityId,
      categoryId: categoryId === 'all' ? undefined : categoryId,
      page: 1,
      limit: 20,
    }),
  });

  const posts = useMemo(() => {
    const nextPosts = [...(postsQuery.data ?? [])];
    nextPosts.sort((a: any, b: any) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (Number.isNaN(aDate)) return 0;
      if (Number.isNaN(bDate)) return 0;
      if (sortOrder === 'oldest') return aDate - bDate;
      if (sortOrder === 'most-likes') return (b.communityLikes?.length ?? 0) - (a.communityLikes?.length ?? 0);
      return bDate - aDate;
    });
    return nextPosts;
  }, [postsQuery.data, sortOrder]);

  return (
    <div className="h-screen overflow-hidden bg-slate-50">
      <DashboardSidebar />
      <Topbar />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 lg:px-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#043658]">Community feed</p>
              <h1 className="mt-2 text-3xl font-semibold text-[#043658]">Discover posts from every community</h1>
            </div>
            <Link href="/community" className="text-sm font-semibold text-[#043658] hover:underline">Back to dashboard</Link>
          </div>

          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <label className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-[#F7F9FC] py-3 pl-11 pr-4 text-sm text-[#043658] outline-none focus:border-[#043658]" placeholder="Search posts or keywords" />
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-[#F7F9FC] px-3 py-3 text-sm text-slate-600">
                <Filter className="h-4 w-4 text-[#043658]" />
                <select value={communityId} onChange={(event) => setCommunityId(event.target.value)} className="bg-transparent outline-none">
                  <option value="all">All communities</option>
                  {(communitiesQuery.data ?? []).map((community: any) => <option key={community.id} value={community.id}>{community.name}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-[#F7F9FC] px-3 py-3 text-sm text-slate-600">
                <Filter className="h-4 w-4 text-[#043658]" />
                <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="bg-transparent outline-none">
                  <option value="all">All categories</option>
                  {(categoriesQuery.data ?? []).map((category: any) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-[#F7F9FC] px-3 py-3 text-sm text-slate-600">
                <Filter className="h-4 w-4 text-[#043658]" />
                <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as any)} className="bg-transparent outline-none">
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="most-likes">Most liked</option>
                </select>
              </label>
            </div>
          </section>

          <section className="mt-6 space-y-6">
            {postsQuery.isLoading ? <div className="rounded-[24px] border border-slate-200 bg-white p-8 text-center text-slate-500">Loading posts…</div> : null}
            {postsQuery.isError ? <div className="rounded-[24px] border border-red-200 bg-red-50 p-8 text-center text-red-700">We could not load posts right now. Please try again.</div> : null}
            {!postsQuery.isLoading && !postsQuery.isError && posts.length === 0 ? <div className="rounded-[24px] border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">No posts match your filters yet.</div> : null}
            {posts.map((post: any) => <PostCard key={post.id} post={post} />)}
          </section>
        </div>
      </main>
    </div>
  );
}