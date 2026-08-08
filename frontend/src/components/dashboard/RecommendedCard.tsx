export function RecommendedCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="font-['Lexend'] font-semibold text-[#043658] text-sm mb-4">
        Recommended for You
      </h3>
      {/* Placeholder gradient tile — swap for a real thumbnail once the
          recommendation API returns actual resource/community images */}
      <div className="h-32 rounded-xl bg-gradient-to-br from-[#043658] to-slate-700 flex items-center justify-center">
        <span className="text-xs text-slate-300">Content preview</span>
      </div>
    </div>
  );
}
