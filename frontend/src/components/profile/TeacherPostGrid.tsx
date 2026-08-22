"use client";

import { getMediaUrl } from "@/lib/media";
import type { TeacherPost } from "@/services/teachers";
import { PostCardSkeleton } from "@/components/post/PostCardSkeleton";

interface TeacherPostGridProps {
  posts: TeacherPost[];
  isLoading: boolean;
  onPostClick?: (postId: string) => void;
}

export function TeacherPostGrid({ posts, isLoading, onPostClick }: TeacherPostGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
        <div className="text-4xl mb-4">📝</div>
        <p className="text-sm font-semibold text-slate-700">No posts yet</p>
        <p className="text-xs text-slate-500 mt-1">This teacher hasn't published any posts.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => {
        const imageAttachment = post.attachments.find((a) => a.type === "IMAGE");
        const thumbnail = imageAttachment ? getMediaUrl(imageAttachment.url) : null;

        return (
          <button
            key={post.id}
            onClick={() => onPostClick?.(post.id)}
            className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition hover:shadow-md hover:border-slate-300"
          >
            {thumbnail ? (
              <div className="relative aspect-video overflow-hidden bg-slate-100">
                <img
                  src={thumbnail}
                  alt={post.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-[#043658]/10 to-[#FFC107]/10">
                <span className="text-4xl">📄</span>
              </div>
            )}

            <div className="flex flex-1 flex-col p-4">
              <div className="mb-2">
                <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {post.category.name}
                </span>
              </div>
              <h3 className="mb-2 text-sm font-semibold text-[#043658] line-clamp-2 group-hover:text-[#032742]">
                {post.title}
              </h3>
              <p className="mb-3 text-xs text-slate-500 line-clamp-2">
                {post.description}
              </p>
              <div className="mt-auto flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span>❤️</span>
                  {post.likesCount}
                </span>
                <span className="flex items-center gap-1">
                  <span>💬</span>
                  {post.commentsCount}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
