'use client';

function Bone({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />;
}

function CardShell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      {/* ── Left column ── */}
      <div className="space-y-4">
        {/* Level card */}
        <CardShell>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Bone className="h-10 w-10 rounded-xl" />
              <div className="space-y-2">
                <Bone className="h-3 w-20" />
                <Bone className="h-5 w-36" />
              </div>
            </div>
            <Bone className="h-6 w-16 rounded-full" />
          </div>
          <div className="mt-4 space-y-2">
            <Bone className="h-2 w-full rounded-full" />
            <Bone className="h-3 w-48" />
          </div>
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <Bone className="h-5 w-5 rounded-full" />
                <Bone className="h-3 flex-1" />
                <Bone className="h-3 w-14 rounded-full" />
              </div>
            ))}
          </div>
          <Bone className="mt-4 h-8 w-full rounded-lg" />
        </CardShell>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <CardShell key={i} className="flex flex-col items-center gap-2 py-3.5 px-2">
              <Bone className="h-4 w-4 rounded" />
              <Bone className="h-6 w-10" />
              <Bone className="h-2.5 w-12 rounded-full" />
            </CardShell>
          ))}
        </div>

        {/* Recent posts */}
        <CardShell className="p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <Bone className="h-4 w-32" />
            <Bone className="h-3 w-16" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-b border-slate-100 px-4 py-3 last:border-0">
              <div className="flex items-start justify-between gap-2">
                <Bone className="h-4 w-2/3" />
                <Bone className="h-3 w-10" />
              </div>
              <div className="mt-2 flex gap-2">
                <Bone className="h-4 w-20 rounded-full" />
                <Bone className="h-4 w-16 rounded-full" />
              </div>
              <div className="mt-2 flex gap-4">
                <Bone className="h-3 w-8" />
                <Bone className="h-3 w-8" />
                <Bone className="h-3 w-8" />
              </div>
            </div>
          ))}
        </CardShell>

        {/* Community feed */}
        <CardShell className="p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <Bone className="h-4 w-32" />
            <Bone className="h-3 w-16" />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3 border-b border-slate-100 px-4 py-3 last:border-0">
              <Bone className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between gap-2">
                  <Bone className="h-3 w-1/2" />
                  <Bone className="h-3 w-10" />
                </div>
                <Bone className="h-3 w-full" />
                <Bone className="h-3 w-3/4" />
                <div className="flex gap-3">
                  <Bone className="h-2.5 w-8" />
                  <Bone className="h-2.5 w-8" />
                </div>
              </div>
            </div>
          ))}
        </CardShell>
      </div>

      {/* ── Right column ── */}
      <div className="space-y-4">
        {/* Activity */}
        <CardShell className="p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <Bone className="h-4 w-28" />
            <Bone className="h-3 w-16" />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3 border-b border-slate-100 px-4 py-3 last:border-0">
              <Bone className="h-5 w-5 rounded shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1.5">
                <div className="flex justify-between gap-2">
                  <Bone className="h-3 w-3/4" />
                  <Bone className="h-3 w-10" />
                </div>
                <Bone className="h-3 w-full" />
              </div>
            </div>
          ))}
        </CardShell>

        {/* Suggested communities */}
        <CardShell className="p-0 overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-3">
            <Bone className="h-4 w-40" />
            <Bone className="mt-1 h-3 w-28" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0">
              <Bone className="h-9 w-9 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Bone className="h-3 w-3/4" />
                <Bone className="h-3 w-1/2" />
              </div>
              <Bone className="h-7 w-12 rounded-lg shrink-0" />
            </div>
          ))}
        </CardShell>

        {/* Trending */}
        <CardShell className="p-0 overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-3">
            <Bone className="h-4 w-36" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0">
              <Bone className="h-8 w-8 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Bone className="h-3 w-4/5" />
                <Bone className="h-2.5 w-1/2" />
              </div>
            </div>
          ))}
        </CardShell>
      </div>
    </div>
  );
}
