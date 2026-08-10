'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/layout/Sidebar';
import { ChatThreadHeader } from '@/components/community/chat/ChatThreadHeader';
import { ChatMessageBubble, ChatMessageData } from '@/components/community/chat/ChatMessageBubble';
import { ChatMessageInput } from '@/components/community/chat/ChatMessageInput';
import { GroupInfoPanel } from '@/components/community/chat/GroupInfoPanel';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/context/AuthContext';

interface PageProps {
  params: Promise<{ type: string; dept: string }>;
}

const DEPT_NAMES: Record<string, string> = {
  mathematics: 'Mathematics', english: 'English', amharic: 'Amharic',
  physics: 'Physics', chemistry: 'Chemistry', biology: 'Biology',
  geography: 'Geography', history: 'History', civics: 'Civics',
  ict: 'ICT / Computer Science', business: 'Business', economics: 'Economics',
  pe: 'Physical Education', general: 'General / Primary Education',
};

const COMMUNITY_LABELS: Record<string, string> = {
  school: 'School', woreda: 'Woreda', zone: 'Zone',
  region: 'Regional', national: 'National',
};

export default function DeptChatPage({ params }: PageProps) {
  const { type, dept } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const deptLabel = DEPT_NAMES[dept] ?? dept.charAt(0).toUpperCase() + dept.slice(1);
  const communityLabel = COMMUNITY_LABELS[type] ?? type;

  const firstName = profile?.firstName ?? user?.firstName ?? '';
  const lastName  = profile?.lastName  ?? user?.lastName  ?? '';
  const myName    = `${firstName} ${lastName}`.trim() || 'You';
  const level     = (profile?.level ?? user?.level ?? 'LEVEL_1').replace('_', ' ');

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'T';
  const deptInitials = deptLabel.substring(0, 2).toUpperCase();

  const [messages, setMessages] = useState<ChatMessageData[]>([
    {
      id: '1', isOwnMessage: false,
      authorName: 'Yididiya Abebe', levelBadge: 'Level 2',
      timestamp: '09:14 AM',
      text: `Good morning! Does anyone have a good approach for teaching Grade 8 ${deptLabel} this semester?`,
    },
    {
      id: '2', isOwnMessage: false,
      authorName: 'Abel Bekele', levelBadge: 'Level 1',
      timestamp: '09:18 AM',
      text: 'I use a lot of group activities and peer teaching. It works really well for keeping students engaged.',
    },
    {
      id: '3', isOwnMessage: false,
      authorName: 'Yididiya Abebe', levelBadge: 'Level 2',
      timestamp: '09:21 AM',
      attachment: { name: `Grade8_${deptLabel}_LessonPlan.pdf`, size: '1.8 MB · PDF' },
    },
    {
      id: '4', isOwnMessage: false,
      authorName: 'Abel Bekele', levelBadge: 'Level 1',
      timestamp: '09:25 AM',
      text: 'Thank you! This is exactly what I needed. I will adapt it for my class.',
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

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden lg:ml-64">
      <DashboardSidebar />

      {/* ── Main chat column ── */}
      <div className="flex flex-1 flex-col bg-white">
        <ChatThreadHeader
          groupName={`${deptLabel} Department`}
          memberCount="28"
          activeNowCount="6"
        />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
            Today — {deptLabel} Department · {communityLabel} Community
          </p>

          {messages.map((msg) => (
            <ChatMessageBubble key={msg.id} message={msg} />
          ))}
        </div>

        <ChatMessageInput
          groupName={`${deptLabel} Department`}
          onSend={handleSend}
        />
      </div>

      {/* ── Right info panel ── */}
      <GroupInfoPanel
        initials={deptInitials}
        name={`${deptLabel} Department`}
        foundedLabel={`${communityLabel} Community · Professional channel`}
        about={`A collaborative space for ${deptLabel} teachers to share lesson plans, teaching strategies, classroom resources, and support each other professionally.`}
        mediaCount={8}
        activeMembers={[
          { id: '1', name: 'Yididiya Abebe', roleLabel: 'Level 2 Teacher' },
          { id: '2', name: 'Abel Bekele',    roleLabel: 'Level 1 Teacher' },
          { id: '3', name: myName,            roleLabel: `${level} · You` },
        ]}
      />
    </div>
  );
}
