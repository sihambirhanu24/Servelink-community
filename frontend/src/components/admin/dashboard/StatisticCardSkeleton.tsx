export function StatisticCardSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-4 w-24 bg-slate-200 rounded mb-3"></div>
          <div className="h-8 w-32 bg-slate-200 rounded mb-2"></div>
          <div className="h-3 w-40 bg-slate-100 rounded"></div>
        </div>
        <div className="h-10 w-10 bg-slate-200 rounded-lg flex-shrink-0"></div>
      </div>
    </div>
  );
}
