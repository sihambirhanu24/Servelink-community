"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText, Heart, MessageCircle, Clock } from "lucide-react";
import Link from "next/link";
import { getMyPosts } from "@/services/profile";

interface RecentPostsCardProps {
  limit?: number;
}

interface PostType {
  id: string;
  title: string;
  createdAt: string;
  community?: { name: string };
  _count?: { communityLikes: number; comments: number };
}

export function RecentPostsCard({ limit = 3 }: RecentPostsCardProps) {
  const { data: posts = [], isLoading } = useQuery<PostType[]>({
    queryKey: ["my-posts"],
    queryFn: getMyPosts,
    staleTime: 30_000,
  });

  const recent = posts.slice(0, limit);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-['Lexend'] font-semibold text-[#043658] text-sm mb-3">
          Recent Posts
        </h3>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-slate-100 bg-slate-50 p-3"
            >
              <div className="h-3 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-2.5 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-['Lexend'] font-semibold text-[#043658] text-sm">
          Recent Posts
        </h3>
        {posts.length > 0 && (
          <Link
            href="/profile/posts"
            className="text-xs font-medium text-[#043658] hover:underline"
          >
            View All
          </Link>
        )}
      </div>

      {recent.length === 0 ? (
        <div className="text-center py-6">
          <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500 mb-1">No posts yet</p>
          <p className="text-[11px] text-slate-400">
            Your posts will appear here once you start contributing.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {recent.map((post) => (
            <Link
              key={post.id}
              href={`/posts/${post.id}`}
              className="block rounded-xl border border-slate-100 p-3 hover:border-[#043658]/20 hover:shadow-sm transition-all"
            >
              <p className="text-xs font-medium text-[#043658] leading-snug line-clamp-2">
                {post.title}
              </p>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                {post.community && (
                  <span className="truncate max-w-[120px]">
                    {post.community.name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
                {post._count && (
                  <>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {post._count.communityLikes ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {post._count.comments ?? 0}
                    </span>
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
