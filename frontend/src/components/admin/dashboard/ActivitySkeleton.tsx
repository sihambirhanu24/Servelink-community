export function ActivitySkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 animate-pulse">
      <div className="h-6 w-40 bg-slate-200 rounded mb-4"></div>
      <div className="space-y-4">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-10 w-10 bg-slate-200 rounded-full flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-slate-200 rounded"></div>
              <div className="h-3 w-32 bg-slate-100 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
