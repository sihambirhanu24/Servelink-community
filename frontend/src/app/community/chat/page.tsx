'use client';

import { useState } from 'react';
import { DashboardSidebar } from '@/components/layout/Sidebar';
import { ConversationList } from '@/components/community/chat/ConversationList';
import { ChatThreadHeader } from '@/components/community/chat/ChatThreadHeader';
import { ChatMessageBubble, ChatMessageData } from '@/components/community/chat/ChatMessageBubble';
import { ChatMessageInput } from '@/components/community/chat/ChatMessageInput';
import { GroupInfoPanel } from '@/components/community/chat/GroupInfoPanel';

// TODO: replace with real data once the Group Messaging module exists —
// this needs its own backend (Conversation, Message, ConversationMember
// tables) plus a websocket/polling layer for live updates. This page is
// UI-only for now, mirroring the mock-data pattern used everywhere else.
const MOCK_MESSAGES: ChatMessageData[] = [
  {
    id: '1',
    isOwnMessage: false,
    authorName: 'Dr. Elias Thorne',
    levelBadge: 'Level 10 Educator',
    timestamp: '10:42 AM',
    text: "Good morning colleagues! I've just uploaded the revised curriculum for the Quantum Mechanics module. Please take a look at the pedagogical shifts in Section 3.",
    reactions: { likeCount: 12, commentCount: 4 },
  },
  {
    id: '2',
    isOwnMessage: false,
    authorName: 'Dr. Elias Thorne',
    levelBadge: 'Level 10 Educator',
    timestamp: '10:42 AM',
    attachment: { name: 'Quantum_Mechanics_V2.pdf', size: '4.2 MB · PDF Document' },
  },
  {
    id: '3',
    isOwnMessage: true,
    authorName: 'Me',
    levelBadge: 'Level 9 Member',
    timestamp: '10:45 AM',
    text: 'Thank you, Elias! The integration of the simulator in Section 3 looks fantastic. I think the students will really benefit from the visual feedback loops.',
  },
  {
    id: '4',
    isOwnMessage: false,
    authorName: 'Prof. Julian Vance',
    levelBadge: 'Dean of Sciences',
    timestamp: '11:02 AM',
    text: "Agreed. Let's schedule a brief sync tomorrow to discuss the pilot implementation.",
  },
];

export default function GroupChatPage() {
  const [activeId, setActiveId] = useState('1');
  const [messages, setMessages] = useState(MOCK_MESSAGES);

  const handleSend = (text: string) => {
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `message-${currentMessages.length + 1}`,
        isOwnMessage: true,
        authorName: 'Me',
        levelBadge: 'Level 9 Member',
        timestamp: 'Just now',
        text,
      },
    ]);
  };

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden lg:ml-64">
      <DashboardSidebar />

      <ConversationList activeId={activeId} onSelect={setActiveId} />

      <div className="flex-1 flex flex-col bg-white">
        <ChatThreadHeader
          groupName="National STEM Educators Hub"
          memberCount="2.4k"
          activeNowCount="142"
        />

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Monday, October 23
          </p>
            {messages.map((message) => (
            <ChatMessageBubble key={message.id} message={message} />
          ))}
        </div>

        <ChatMessageInput
          groupName="National STEM Educators Hub"
          onSend={handleSend}
        />
      </div>

      <GroupInfoPanel
        initials="NS"
        name="National STEM Educators Hub"
        foundedLabel="Founded September 2023"
        about="A collaborative hub for national-level educators focused on advancing STEM pedagogy through research, shared resources, and peer-to-peer mentorship."
        mediaCount={12}
        activeMembers={[
          { id: '1', name: 'Dr. Elias Thorne', roleLabel: 'Level 10 Educator' },
          { id: '2', name: 'Prof. Julian Vance', roleLabel: 'Dean of Sciences' },
        ]}
      />
    </div>
  );
}
