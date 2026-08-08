import { CheckCircle2, Circle } from 'lucide-react';

interface Requirement {
  id: string;
  label: string;
  met: boolean;
}

interface ProgressToLevelCardProps {
  nextLevel: number;
  currentXp: number;
  xpToNextLevel: number;
  percentComplete: number;
  requirements: Requirement[];
}

export function ProgressToLevelCard({
  nextLevel,
  currentXp,
  xpToNextLevel,
  percentComplete,
  requirements,
}: ProgressToLevelCardProps) {
  const xpLeft = xpToNextLevel - currentXp;

  return (
    <div className="rounded-2xl bg-[#043658] p-5 text-white">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Progress to Level {nextLevel}</p>
        <span className="rounded-full bg-[#FFC107] text-[#043658] text-[10px] font-semibold px-2.5 py-1">
          {percentComplete}% Complete
        </span>
      </div>

      <div className="mt-3 h-2 w-full rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full bg-[#FFC107]" style={{ width: `${percentComplete}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-slate-400">
        {currentXp} / {xpToNextLevel} XP · {xpLeft} XP Left
      </p>

      <div className="mt-4 space-y-1.5">
        {requirements.map((req) => (
          <div key={req.id} className="flex items-center gap-2 text-xs">
            {req.met ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-[#FFC107]" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-slate-500" />
            )}
            <span className={req.met ? 'text-slate-300' : 'text-slate-400'}>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
