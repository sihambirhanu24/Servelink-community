'use client';

import { useRouter } from 'next/navigation';
import { Image, HelpCircle, PenLine } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/hooks/useProfile';

export function CommunityPostComposer() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const firstName = profile?.firstName ?? user?.firstName ?? '';
  const lastName = profile?.lastName ?? user?.lastName ?? '';
  const name = `${firstName} ${lastName}`.trim() || 'Teacher';
  const profileImage = profile?.profileImage ?? user?.profileImage ?? undefined;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Avatar name={name} profileImage={profileImage} size="sm" className="shrink-0" />
        <button
          type="button"
          onClick={() => router.push('/community/create')}
          className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-sm text-slate-400 transition-colors hover:border-[#043658]/30 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#043658]/20"
        >
          Share something with your community…
        </button>
      </div>
      <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-3">
        {[
          { icon: Image, label: 'Photo / File' },
          { icon: HelpCircle, label: 'Ask Question' },
          { icon: PenLine, label: 'Create Post' },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            type="button"
            onClick={() => router.push('/community/create')}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-[#043658] focus:outline-none focus:ring-2 focus:ring-[#043658]/20"
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
