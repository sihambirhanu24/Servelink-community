import { CheckCircle2, Circle } from 'lucide-react';

interface Requirement {
  id: string;
  label: string;
  met: boolean;
}

interface Props {
  currentLevel: string;
  stats: {
    posts: number;
    likes: number;
    communities: number;
  };
}

const LEVEL_XP_REQUIREMENTS: Record<string, number> = {
  LEVEL_1: 500,
  LEVEL_2: 1000,
  LEVEL_3: 2000,
  LEVEL_4: 5000,
  LEVEL_5: 10000,
};

const LEVEL_NUMBERS: Record<string, number> = {
  LEVEL_1: 1,
  LEVEL_2: 2,
  LEVEL_3: 3,
  LEVEL_4: 4,
  LEVEL_5: 5,
};

function calculateXP(stats: { posts: number; likes: number; communities: number }): number {
  return (stats.posts * 50) + (stats.likes * 5) + (stats.communities * 20);
}

function getRequirements(level: string, stats: any): Requirement[] {
  const requirements: Requirement[] = [];
  
  requirements.push({
    id: '1',
    label: 'Create your first post',
    met: stats.posts > 0,
  });
  
  requirements.push({
    id: '2',
    label: 'Join at least 2 communities',
    met: stats.communities >= 2,
  });
  
  requirements.push({
    id: '3',
    label: 'Receive 10 likes on your posts',
    met: stats.likes >= 10,
  });
  
  if (level === 'LEVEL_1') {
    requirements.push({
      id: '4',
      label: 'Create 5 posts',
      met: stats.posts >= 5,
    });
  }
  
  return requirements;
}

export function ProgressToLevelCard({ currentLevel, stats }: Props) {
  const levelNum = LEVEL_NUMBERS[currentLevel] || 1;
  const nextLevel = levelNum + 1;
  const xpToNextLevel = LEVEL_XP_REQUIREMENTS[currentLevel] || 500;
  const currentXp = calculateXP(stats);
  const percentComplete = Math.min(Math.round((currentXp / xpToNextLevel) * 100), 100);
  const xpLeft = Math.max(xpToNextLevel - currentXp, 0);
  
  const requirements = getRequirements(currentLevel, stats);

  if (levelNum >= 5) {
    return (
      <div className="rounded-2xl bg-[#043658] p-5 text-white">
        <div className="flex items-center justify-center flex-col">
          <div className="rounded-full bg-[#FFC107] text-[#043658] text-2xl font-bold w-16 h-16 flex items-center justify-center mb-3">
            ⭐
          </div>
          <p className="text-sm font-semibold text-center">Maximum Level Reached!</p>
          <p className="text-xs text-slate-300 mt-2 text-center">
            You've reached the highest level. Keep contributing!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#043658] p-5 text-white">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Progress to Level {nextLevel}</p>
        <span className="rounded-full bg-[#FFC107] text-[#043658] text-[10px] font-semibold px-2.5 py-1">
          {percentComplete}% Complete
        </span>
      </div>

      <div className="mt-3 h-2 w-full rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full bg-[#FFC107] transition-all duration-500" style={{ width: `${percentComplete}%` }} />
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
      
      <div className="mt-3 pt-3 border-t border-white/10">
        <p className="text-[10px] text-slate-400">
          💡 Earn XP: Posts (+50), Likes (+5), Communities (+20)
        </p>
      </div>
    </div>
  );
}
