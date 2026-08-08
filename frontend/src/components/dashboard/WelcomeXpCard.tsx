interface WelcomeXpCardProps {
  levelLabel: string; // "LEVEL 3 EDUCATOR"
  userName: string;
  encouragement: string;
  currentXp: number;
  xpToNextLevel: number;
  nextUnlockLabel: string;
}

export function WelcomeXpCard({
  levelLabel,
  userName,
  encouragement,
  currentXp,
  xpToNextLevel,
  nextUnlockLabel,
}: WelcomeXpCardProps) {
  const percent = Math.round((currentXp / xpToNextLevel) * 100);

  return (
    <div className="rounded-2xl bg-[#043658] p-6 text-white">
      <span className="inline-block rounded-full bg-[#FFC107] px-3 py-1 text-[10px] font-semibold text-[#043658] uppercase tracking-wide">
        {levelLabel}
      </span>

      <h1 className="mt-4 font-['Lexend'] text-2xl font-semibold leading-snug">
        Welcome back,
        <br />
        {userName}
      </h1>
      <p className="mt-2 text-sm text-slate-300 max-w-xs leading-relaxed">{encouragement}</p>

      <div className="mt-6">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-300">
            Progress to Level {/* next level number derived by caller */}
          </span>
          <span className="font-semibold text-[#FFC107]">
            {currentXp} / {xpToNextLevel} XP
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#FFC107] transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-400">Next Unlock: {nextUnlockLabel}</p>
      </div>
    </div>
  );
}
