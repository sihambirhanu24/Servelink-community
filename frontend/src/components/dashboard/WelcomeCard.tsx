interface WelcomeCardProps {
  firstNameGreeting: string;
  summary: string;
  levelLabel: string;
  progressPercent: number;
  pointsToNextRank: number;
}

export function WelcomeCard({
  firstNameGreeting,
  summary,
  levelLabel,
  progressPercent,
  pointsToNextRank,
}: WelcomeCardProps) {
  return (
    <div className="flex flex-col items-start justify-between gap-6 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center">
      <div className="min-w-0">
        <h1 className="font-['Lexend'] text-xl font-semibold text-[#043658]">
          {firstNameGreeting}
        </h1>
        <p className="mt-1 text-sm text-slate-500 max-w-md leading-relaxed">{summary}</p>
      </div>

      <div className="w-full shrink-0 lg:w-48">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-medium text-[#043658]">{levelLabel}</span>
          <span className="font-semibold text-[#043658]">{progressPercent}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#FFC107] transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-slate-400">{pointsToNextRank} points to next rank</p>
      </div>
    </div>
  );
}
