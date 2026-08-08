import Link from 'next/link';
import { Search, Bell, MessageCircle } from 'lucide-react';

interface CommunityPageHeaderProps {
  userName: string;
  userRole: string;
}

export function CommunityPageHeader({ userName, userRole }: CommunityPageHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 mb-6">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search resources or members..."
          className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]"
        />
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {/* New: opens the group chat interface at /community/chat */}
        <Link href="/community/chat" className="rounded-full p-2 hover:bg-slate-100 transition-colors">
          <MessageCircle className="h-5 w-5 text-slate-500" />
        </Link>

        <button className="relative rounded-full p-2 hover:bg-slate-100 transition-colors">
          <Bell className="h-5 w-5 text-slate-500" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#FFC107] ring-2 ring-white" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-full bg-[#043658] flex items-center justify-center text-white text-xs font-semibold">
            {userName.split(' ').map((n) => n[0]).join('')}
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-[#043658] leading-tight">{userName}</p>
            <p className="text-xs text-slate-400 leading-tight">{userRole}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
