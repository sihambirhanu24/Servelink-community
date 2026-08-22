'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { DashboardSidebar } from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { ChatThreadHeader } from '@/components/community/chat/ChatThreadHeader';
import { ChatMessageBubble, ChatMessageData } from '@/components/community/chat/ChatMessageBubble';
import { ChatMessageInput } from '@/components/community/chat/ChatMessageInput';
import { GroupInfoPanel } from '@/components/community/chat/GroupInfoPanel';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/context/AuthContext';
import { getCommunity } from '@/services/community';

interface PageProps {
  params: Promise<{ schoolId: string }>;
}

export default function SchoolChatPage({ params }: PageProps) {
  const { schoolId } = use(params);
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const { data: community, isLoading, isError, refetch } = useQuery({
    queryKey: ['community', schoolId],
    queryFn: () => getCommunity(schoolId),
    staleTime: 60_000,
    retry: 1,
  });

  const firstName = profile?.firstName ?? user?.firstName ?? '';
  const lastName  = profile?.lastName  ?? user?.lastName  ?? '';
  const myName    = `${firstName} ${lastName}`.trim() || 'You';
  const level     = (profile?.level ?? user?.level ?? 'LEVEL_1').replace('_', ' ');

  const [messages, setMessages] = useState<ChatMessageData[]>([
    {
      id: '1', isOwnMessage: false,
      authorName: 'Yididiya Abebe', levelBadge: 'Level 2',
      timestamp: '08:30 AM',
      text: 'Good morning everyone! Has anyone finalized the curriculum plan for this semester?',
    },
    {
      id: '2', isOwnMessage: false,
      authorName: 'Abel Bekele', levelBadge: 'Level 1',
      timestamp: '08:45 AM',
      text: "Yes, I've just finished the draft for the Grade 8 section. I've attached it here for review.",
      attachment: { name: 'Grade8_Curriculum_Plan.pdf', size: '2.3 MB · PDF' },
    },
    {
      id: '3', isOwnMessage: true,
      authorName: myName, levelBadge: level,
      timestamp: '09:00 AM',
      text: "Thank you! I'll take a look before our meeting this afternoon.",
    },
  ]);

  function handleSend(text: string) {
    setMessages(prev => [
      ...prev,
      {
        id: `m-${Date.now()}`,
        isOwnMessage: true,
        authorName: myName,
        levelBadge: level,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text,
      },
    ]);
  }

  if (isLoading) {
    return (
      <div className="h-screen overflow-hidden bg-[#F7FAFC]">
        <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#043658] border-t-transparent" />
            <p className="text-sm text-slate-500">Loading community…</p>
          </div>
        </main>
      </div>
    );
  }

  if (isError || !community) {
    return (
      <div className="h-screen overflow-hidden bg-[#F7FAFC]">
        <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 font-semibold text-[#043658]">Couldn't load this community.</p>
            <button
              onClick={() => refetch()}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#043658] px-4 py-2 text-sm font-semibold text-white hover:bg-[#032d4a]"
            >
              <RefreshCw className="h-4 w-4" /> Try Again
            </button>
            <button
              onClick={() => router.push('/community/type/woreda/schools')}
              className="ml-3 mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#043658] hover:bg-slate-50"
            >
              ← Back to Schools
            </button>
          </div>
        </main>
      </div>
    );
  }

  const memberCount = community._count?.communityMembers ?? community.communityMembers?.length ?? 0;
  const initials = community.name.substring(0, 2).toUpperCase();

  return (
    <div className="h-screen overflow-hidden bg-slate-50">
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] flex overflow-hidden">
        {/* ── Main chat column ── */}
        <div className="flex flex-1 flex-col bg-white">
          <ChatThreadHeader
            groupName={community.name}
            memberCount={String(memberCount)}
            activeNowCount="Online"
          />

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
              Today — {community.name}
            </p>
            {messages.map(msg => (
              <ChatMessageBubble key={msg.id} message={msg} />
            ))}
          </div>

          <ChatMessageInput
            groupName={community.name}
            onSend={handleSend}
          />
        </div>

        {/* ── Right info panel ── */}
        <GroupInfoPanel
          initials={initials}
          name={community.name}
          foundedLabel={`School Community · ${community.woreda ?? ''}`}
          about={community.description ?? `A professional community for teachers of ${community.name}. Share resources, collaborate on lesson plans, and grow your professional network.`}
          mediaCount={community._count?.posts ?? 0}
          activeMembers={
            (community.communityMembers ?? []).slice(0, 5).map((m: any) => ({
              id: m.id,
              name: m.teacher ? `${m.teacher.firstName} ${m.teacher.lastName}`.trim() : 'Teacher',
              roleLabel: m.teacher?.level?.replace('_', ' ') ?? 'Teacher',
            }))
          }
        />
      </main>
    </div>
  );
}
