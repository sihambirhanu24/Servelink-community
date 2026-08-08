interface Requirement {
  id: string;
  label: string;
  met: boolean;
}

interface LevelProgressCardProps {
  currentLevel: number;
  xpRemaining: number;
  percentComplete: number;
  nextLevel: number;
  requirements: Requirement[];
}

// Circular progress via SVG stroke-dasharray — the standard technique
// for a ring meter without pulling in a charting library for one shape.
function ProgressRing({ percent }: { percent: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width="110" height="110" viewBox="0 0 110 110" className="-rotate-90">
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

export function LevelProgressCard({
  currentLevel,
  xpRemaining,
  percentComplete,
  nextLevel,
  requirements,
}: LevelProgressCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Current Progress</p>

      <div className="mt-4 flex items-center justify-center relative">
        <ProgressRing percent={percentComplete} />
        <div className="absolute flex flex-col items-center">
          <p className="text-xs text-slate-400">Lvl {currentLevel}</p>
          <p className="text-sm font-semibold text-[#043658]">{xpRemaining} Left</p>
          <p className="mt-1 text-[10px] font-semibold text-[#FFC107]">
            {percentComplete}% COMPLETED
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs font-semibold text-[#043658]">Requirements for Level {nextLevel}:</p>
      <ul className="mt-2 space-y-1.5">
        {requirements.map((req) => (
          <li key={req.id} className="flex items-center gap-2 text-xs text-slate-500">
            <span
              className={`h-1.5 w-1.5 rounded-full ${req.met ? 'bg-emerald-500' : 'bg-slate-300'}`}
            />
            {req.label}
          </li>
        ))}
      </ul>

      <button className="mt-4 text-xs font-medium text-[#043658] hover:underline">
        View Progress
      </button>
    </div>
  );
}
