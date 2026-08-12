'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, Info, MessageSquare, Loader } from 'lucide-react';
import { DashboardSidebar } from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble';
import { useChatSocket } from '@/hooks/useChatSocket';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import api from '@/lib/axios';

interface Community {
  id: string;
  name: string;
  type: string;
  description?: string;
}

interface GroupInfoPanelProps {
  community: Community;
  onClose: () => void;
}

function GroupInfoPanel({ community, onClose }: GroupInfoPanelProps) {
  const [sharedMediaCount, setSharedMediaCount] = useState(0);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get(`/community/${community.id}/chat/attachments/stats`);
        setStats(res.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    fetchStats();
  }, [community.id]);

  return (
    <div className="w-full max-w-sm bg-white border-l border-slate-200 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Group Info</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Group header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#043658] to-[#FFC107] rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold">
            {community.name.slice(0, 2).toUpperCase()}
          </div>
          <h3 className="font-semibold text-lg text-slate-900">{community.name}</h3>
          <p className="text-sm text-slate-500">{community.type} Community</p>
          {community.description && (
            <p className="text-sm text-slate-600 mt-2">{community.description}</p>
          )}
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50 rounded p-3 text-center">
              <div className="text-lg font-semibold text-[#043658]">{stats.totalAttachments}</div>
              <div className="text-xs text-slate-500">Files</div>
            </div>
            <div className="bg-slate-50 rounded p-3 text-center">
              <div className="text-lg font-semibold text-[#043658]">
                {(stats.totalSize / 1024 / 1024).toFixed(0)} MB
              </div>
              <div className="text-xs text-slate-500">Total</div>
            </div>
            <div className="bg-slate-50 rounded p-3 text-center">
              <div className="text-lg font-semibold text-[#043658]">{stats.byType?.IMAGE || 0}</div>
              <div className="text-xs text-slate-500">Images</div>
            </div>
          </div>
        )}

        {/* Sections */}
        <div className="space-y-3">
          <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-3 text-slate-700 font-medium">
            <MessageSquare className="w-5 h-5 text-slate-400" />
            View Pinned Messages
          </button>
          <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-3 text-slate-700 font-medium">
            <Info className="w-5 h-5 text-slate-400" />
            Shared Media
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CommunityChatPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = params?.id as string;
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [community, setCommunity] = useState<Community | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const {
    messages,
    isConnected,
    isLoading,
    error,
    typingUsers,
    unreadCount,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    pinMessage,
    unpinMessage,
    startTyping,
    stopTyping,
  } = useChatSocket(communityId);

  // Fetch community details
  useEffect(() => {
    if (!communityId) return;

    const fetchCommunity = async () => {
      try {
        const { data } = await api.get(`/community/${communityId}`);
        setCommunity(data);
      } catch (error) {
        console.error('Failed to load community:', error);
        router.push('/community');
      }
    };

    fetchCommunity();
  }, [communityId, router]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(
    (content: string, attachmentUrls?: string[]) => {
      sendMessage(content, undefined, attachmentUrls);
    },
    [sendMessage],
  );

  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditContent(content);
  };

  const handleSaveEdit = () => {
    if (editingMessageId && editContent.trim()) {
      editMessage(editingMessageId, editContent);
      setEditingMessageId(null);
      setEditContent('');
    }
  };

  if (!communityId || !community) {
    return (
      <div className="h-screen overflow-hidden bg-slate-50">
        <DashboardSidebar />
        <Topbar />
        <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center">
            <Loader className="h-8 w-8 animate-spin mx-auto text-slate-400 mb-4" />
            <p className="text-slate-600">Loading chat...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-50">
      <DashboardSidebar />
      <Topbar />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-hidden flex">
        {/* Back button */}
        <div className="fixed top-16 left-0 right-0 z-10 bg-white border-b border-slate-100 px-6 py-2 lg:ml-64 flex items-center justify-between">
          <Link
            href="/community"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#043658] hover:opacity-70"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Communities
          </Link>
          <button
            onClick={() => setShowInfoPanel(!showInfoPanel)}
            className="lg:hidden text-slate-400 hover:text-slate-600"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>

        {/* Chat container */}
        <div className="flex-1 flex flex-col overflow-hidden mt-9">
          {/* Chat header */}
          <div className="bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between">
            <div>
              <h1 className="font-semibold text-slate-900">{community.name}</h1>
              <p className="text-xs text-slate-500">
                {isConnected ? '🟢 Connected' : '🔴 Offline'} •{' '}
                {typingUsers.length > 0
                  ? `${typingUsers.length} typing...`
                  : 'Ready'}
              </p>
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className="bg-red-50 border-b border-red-200 px-6 py-3 text-sm text-red-700 flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => window.location.reload()}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader className="h-8 w-8 animate-spin mx-auto text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500">Loading messages...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No messages yet</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Start the conversation with your community!
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessageBubble
                  key={message.id}
                  message={message}
                  isOwnMessage={message.senderId === user?.id}
                  onEdit={() => handleEditMessage(message.id, message.content)}
                  onDelete={() => deleteMessage(message.id)}
                  onReact={(reaction) => {
                    if (message.reactions?.[reaction]) {
                      removeReaction(message.id, reaction);
                    } else {
                      addReaction(message.id, reaction);
                    }
                  }}
                  onPin={() => pinMessage(message.id)}
                  onUnpin={() => unpinMessage(message.id)}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Edit mode */}
          {editingMessageId && (
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-slate-500 mb-1">Editing message</p>
                <input
                  type="text"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') {
                      setEditingMessageId(null);
                      setEditContent('');
                    }
                  }}
                />
              </div>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-[#043658] text-white rounded-lg text-sm hover:bg-[#043658]/90 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditingMessageId(null);
                  setEditContent('');
                }}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Message composer */}
          <ChatComposer
            onSendMessage={handleSendMessage}
            isConnected={isConnected}
            communityId={communityId}
            onTyping={(isTyping) => {
              if (isTyping) startTyping();
              else stopTyping();
            }}
          />
        </div>

        {/* Info panel - desktop */}
        {!showInfoPanel && (
          <div className="hidden lg:block">
            <GroupInfoPanel community={community} onClose={() => setShowInfoPanel(false)} />
          </div>
        )}

        {/* Info panel - mobile drawer */}
        {showInfoPanel && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setShowInfoPanel(false)}
            />
            <div className="fixed right-0 top-0 bottom-0 z-50 lg:hidden overflow-y-auto">
              <GroupInfoPanel community={community} onClose={() => setShowInfoPanel(false)} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
