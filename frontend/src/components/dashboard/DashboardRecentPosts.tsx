'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, Bookmark, FilePlus, ChevronRight } from 'lucide-react';
import type { DashboardRecentPost } from '@/types/dashboard';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Yesterday';
  return `${d}d ago`;
}

interface Props {
  posts: DashboardRecentPost[];
}

export function DashboardRecentPosts({ posts }: Props) {
  const router = useRouter();

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-[#043658]">Your Recent Posts</h2>
        <Link
          href="/profile/posts"
          className="flex items-center gap-1 text-xs font-medium text-[#043658] hover:underline focus:outline-none focus:ring-2 focus:ring-[#043658]/30 rounded"
        >
          View All <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <FilePlus className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">No posts yet</p>
            <p className="mt-0.5 text-xs text-slate-400">
              Share something with your community
            </p>
          </div>
          <button
            onClick={() => router.push('/posts')}
            className="mt-1 rounded-lg bg-[#043658] px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#043658]/30"
          >
            Create Post
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/community/posts/${post.id}`}
                className="group block px-4 py-3 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#043658]/20"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-1 text-sm font-medium text-[#043658] group-hover:underline">
                    {post.title}
                  </p>
                  <span className="shrink-0 text-[10px] text-slate-400">
                    {relativeTime(post.createdAt)}
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-3">
                  {post.community && (
                    <span className="rounded-full bg-[#043658]/8 px-2 py-0.5 text-[10px] font-medium text-[#043658]">
                      {post.community.name}
                    </span>
                  )}
                  {post.category && (
                    <span className="rounded-full bg-[#FFC107]/20 px-2 py-0.5 text-[10px] font-medium text-[#765900]">
                      {post.category.name}
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {post._count.communityLikes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {post._count.comments}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bookmark className="h-3 w-3" />
                    {post._count.communityBookmarks}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
