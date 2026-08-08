'use client';

import Link from 'next/link';
import { Heart, MessageCircle, ChevronRight, Rss } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import type { DashboardFeedPost } from '@/types/dashboard';

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
  posts: DashboardFeedPost[];
}

export function DashboardCommunityFeed({ posts }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-[#043658]">Community Feed</h2>
        <Link
          href="/community"
          className="flex items-center gap-1 text-xs font-medium text-[#043658] hover:underline focus:outline-none focus:ring-2 focus:ring-[#043658]/30 rounded"
        >
          See All <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <Rss className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">No feed activity</p>
            <p className="mt-0.5 text-xs text-slate-400">
              Join communities to see posts from other teachers
            </p>
          </div>
          <Link
            href="/community"
            className="mt-1 rounded-lg bg-[#043658] px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#043658]/30"
          >
            Explore Communities
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {posts.map((post) => {
            const teacher = post.teacher;
            const name = teacher
              ? `${teacher.firstName} ${teacher.lastName}`
              : 'Teacher';

            return (
              <li key={post.id}>
                <Link
                  href={`/community/posts/${post.id}`}
                  className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#043658]/20"
                >
                  <Avatar
                    name={name}
                    profileImage={teacher?.profileImage}
                    size="sm"
                    className="mt-0.5 shrink-0"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-[#043658]">
                          {name}
                        </span>
                        {post.community && (
                          <span className="ml-1.5 text-xs text-slate-400">
                            in{' '}
                            <span className="font-medium text-slate-600">
                              {post.community.name}
                            </span>
                          </span>
                        )}
                      </div>
                      <span className="shrink-0 text-[10px] text-slate-400">
                        {relativeTime(post.createdAt)}
                      </span>
                    </div>

                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-600 group-hover:text-slate-800">
                      <span className="font-medium text-slate-700">{post.title}</span>
                      {post.description ? ` — ${post.description}` : ''}
                    </p>

                    <div className="mt-1.5 flex items-center gap-3 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Heart className="h-2.5 w-2.5" />
                        {post._count.communityLikes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-2.5 w-2.5" />
                        {post._count.comments}
                      </span>
                      {post.category && (
                        <span className="rounded-full bg-[#FFC107]/15 px-1.5 py-0.5 font-medium text-[#765900]">
                          {post.category.name}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
