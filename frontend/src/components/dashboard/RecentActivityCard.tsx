import { FileEdit, Award, UserPlus, LucideIcon } from 'lucide-react';

interface ActivityItem {
  id: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  message: string; // supports a bolded segment via **text**
  timeAgo: string;
}

const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: '1',
    icon: FileEdit,
    iconBg: 'bg-[#FFC107]/15',
    iconColor: 'text-[#926E00]',
    message: 'Your review for **"AP Physics - Unit 4 Advanced Mechanics"** has been approved and shared with the Science Department.',
    timeAgo: '2h ago',
  },
  {
    id: '2',
    icon: Award,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    message: 'Congratulations! You earned the **"Mentorship Beacon"** badge for helping 50+ junior educators this semester.',
    timeAgo: '5h ago',
  },
  {
    id: '3',
    icon: UserPlus,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    message: '**Prof. Sarah Mitchell** joined the "Innovative Pedagogy" group you moderate.',
    timeAgo: 'Yesterday',
  },
];

// Tiny helper to bold **segments** without pulling in a markdown parser
function renderMessage(message: string) {
  const parts = message.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') ? (
      <span key={i} className="font-semibold text-[#043658]">
        {part.slice(2, -2)}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function RecentActivityCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-['Lexend'] font-semibold text-[#043658] text-sm">Recent Activity</h3>
        <button className="text-xs font-medium text-[#043658] hover:underline">
          View History →
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {MOCK_ACTIVITY.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <div className={`h-8 w-8 rounded-lg ${item.iconBg} flex items-center justify-center shrink-0`}>
              <item.icon className={`h-4 w-4 ${item.iconColor}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-600 leading-relaxed">{renderMessage(item.message)}</p>
            </div>
            <span className="text-xs text-slate-400 shrink-0">{item.timeAgo}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
