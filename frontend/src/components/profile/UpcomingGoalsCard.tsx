import { Flag, Circle } from 'lucide-react';

interface Goal {
  id: string;
  label: string;
}

const MOCK_GOALS: Goal[] = [
  { id: '1', label: 'Publish 5 more STEM resources' },
  { id: '2', label: 'Mentor 2 junior educators' },
];

export function UpcomingGoalsCard() {
  return (
    <div className="rounded-2xl bg-[#043658] p-5 text-white">
      <div className="flex items-center gap-2 mb-3">
        <Flag className="h-4 w-4 text-[#FFC107]" />
        <h3 className="font-['Lexend'] font-semibold text-sm">Upcoming Goals</h3>
      </div>
      <div className="space-y-2.5">
        {MOCK_GOALS.map((goal) => (
          <div key={goal.id} className="flex items-center gap-2.5 text-sm text-slate-200">
            <Circle className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            {goal.label}
          </div>
        ))}
      </div>
    </div>
  );
}
