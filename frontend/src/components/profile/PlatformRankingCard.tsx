import { TrendingUp } from 'lucide-react';

// Simple mini bar chart — a fixed set of relative heights standing in
// for "your rank compared to nearby peers" until a real ranking
// distribution endpoint exists.
const BAR_HEIGHTS = [30, 45, 55, 70, 90, 60];
const HIGHLIGHT_INDEX = 4; // the bar representing "you"

export function PlatformRankingCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-['Lexend'] font-semibold text-[#043658] text-sm">Platform Ranking</h3>
        <TrendingUp className="h-4 w-4 text-emerald-500" />
      </div>
      <p className="font-['Lexend'] text-xl font-semibold text-[#043658]">
        #24 <span className="text-sm font-normal text-slate-400">/ 1,540</span>
      </p>
      <div className="mt-4 flex items-end gap-1.5 h-16">
        {BAR_HEIGHTS.map((h, i) => (
          <div
            key={i}
            className={`flex-1 rounded-t ${i === HIGHLIGHT_INDEX ? 'bg-[#FFC107]' : 'bg-slate-100'}`}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}
