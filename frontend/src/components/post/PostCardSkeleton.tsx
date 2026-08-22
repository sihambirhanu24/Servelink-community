export function PostCardSkeleton() {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="p-4 sm:p-5">
        {/* Post Header Skeleton */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-200" />
            <div className="min-w-0 flex-1">
              <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
              <div className="mt-1.5 h-3 w-48 animate-pulse rounded bg-slate-200" />
            </div>
          </div>
          <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200" />
        </div>

        {/* Post Content Skeleton */}
        <div className="mt-3 space-y-2">
          <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />
        </div>

        {/* Tags Skeleton */}
        <div className="mt-3 flex gap-2">
          <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200" />
          <div className="h-6 w-24 animate-pulse rounded-full bg-slate-200" />
        </div>

        {/* Attachment Skeleton */}
        <div className="mt-4 h-52 animate-pulse rounded-xl bg-slate-200" />
      </div>

      {/* Actions Skeleton */}
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-4">
          <div className="h-8 w-16 animate-pulse rounded bg-slate-200" />
          <div className="h-8 w-16 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 animate-pulse rounded bg-slate-200" />
          <div className="h-8 w-8 animate-pulse rounded bg-slate-200" />
        </div>
      </div>
    </article>
  );
}
