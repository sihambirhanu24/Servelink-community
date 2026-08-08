function ProgressRing({ percent }: { percent: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width="100" height="100" viewBox="0 0 110 110" className="-rotate-90">
      <circle cx="55" cy="55" r={radius} fill="none" stroke="#F1F5F9" strokeWidth="10" />
      <circle
        cx="55"
        cy="55"
        r={radius}
        fill="none"
        stroke="#FFC107"
        strokeWidth="10"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ProfileStrengthCard({ percent }: { percent: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col items-center text-center">
      <div className="relative flex items-center justify-center">
        <ProgressRing percent={percent} />
        <span className="absolute font-['Lexend'] text-lg font-semibold text-[#043658]">
          {percent}%
        </span>
      </div>
      <p className="mt-3 text-xs font-semibold text-[#043658]">Profile Strength</p>
      <p className="text-xs text-slate-400 mt-1">Add a personal bio to reach 100%.</p>
      <button className="mt-4 w-full rounded-lg bg-[#043658] py-2 text-xs font-medium text-white hover:bg-[#043658]/90 transition-colors">
        Complete Profile
      </button>
    </div>
  );
}
