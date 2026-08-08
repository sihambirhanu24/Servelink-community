import { Search, MoreVertical } from 'lucide-react';

interface ChatThreadHeaderProps {
  groupName: string;
  memberCount: string;
  activeNowCount: string;
}

export function ChatThreadHeader({ groupName, memberCount, activeNowCount }: ChatThreadHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
      <div>
        <p className="font-['Lexend'] font-semibold text-[#043658] text-sm">{groupName}</p>
        <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#FFC107]" />
          {memberCount} Members · {activeNowCount} Active Now
        </p>
      </div>
      <div className="flex items-center gap-3 text-slate-400">
        <button className="hover:text-[#043658]">
          <Search className="h-4 w-4" />
        </button>
        <button className="hover:text-[#043658]">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
