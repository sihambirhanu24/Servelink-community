export function ChartSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 animate-pulse">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="h-6 w-48 bg-slate-200 rounded mb-2"></div>
            <div className="h-4 w-64 bg-slate-100 rounded"></div>
          </div>
          <div className="h-10 w-32 bg-slate-200 rounded"></div>
        </div>

        {/* Chart bars simulation - using fixed heights instead of random */}
        <div className="flex items-end gap-2 h-64">
          {[65, 72, 58, 80, 45, 70, 55, 68, 62, 75, 48, 85].map((height, i) => (
            <div
              key={i}
              className="flex-1 bg-slate-200 rounded-t"
              style={{
                height: `${height}%`,
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
