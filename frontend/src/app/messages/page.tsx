'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Search, MessageCircle, Users, Loader2 } from 'lucide-react';
import { useDirectConversations } from '@/hooks/useDirectMessages';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { formatDistanceToNow } from 'date-fns';
import { DashboardSidebar } from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

export default function MessagesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: conversations, isLoading } = useDirectConversations();

  // Set up WebSocket for real-time conversation updates
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const io = require('socket.io-client');
    const socket = io(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('direct:message:new', () => {
      // Invalidate conversations query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['direct-conversations'] });
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  const filteredConversations = conversations?.filter((conv) => {
    const name = `${conv.otherParticipant.firstName} ${conv.otherParticipant.lastName}`.toLowerCase();
    const lastMessage = conv.lastMessage?.content?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return name.includes(query) || lastMessage.includes(query);
  });

  const handleSelectConversation = (conversationId: string) => {
    router.push(`/messages/${conversationId}`);
  };

  const formatLevel = (level: string) => {
    return level.replace(/^LEVEL_/, 'Level ').replace(/_/g, ' ');
  };

  return (
    <div className="h-screen overflow-hidden bg-[#F5F8FB]">
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-[#043658]">Messages</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#043658] mb-4" />
                <p className="text-sm text-slate-600">Loading conversations...</p>
              </div>
            </div>
          ) : filteredConversations && filteredConversations.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation.id)}
                  className={`w-full p-4 hover:bg-white transition-colors text-left ${
                    conversation.unreadCount > 0 ? 'bg-white' : 'bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      <Avatar
                        className="h-12 w-12"
                      >
                        <AvatarImage
                          src={conversation.otherParticipant.profileImage || undefined}
                          alt={`${conversation.otherParticipant.firstName} ${conversation.otherParticipant.lastName}`}
                        />
                        <AvatarFallback>
                          {conversation.otherParticipant.firstName[0]}{conversation.otherParticipant.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.otherParticipant.verified && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#FFC107] rounded-full border-2 border-white flex items-center justify-center">
                          <span className="text-[8px] text-[#043658] font-bold">✓</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-semibold truncate ${
                          conversation.unreadCount > 0 ? 'text-[#043658]' : 'text-slate-700'
                        }`}>
                          {conversation.otherParticipant.firstName} {conversation.otherParticipant.lastName}
                        </h3>
                        <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                          {conversation.lastMessage
                            ? formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })
                            : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs ${
                          conversation.unreadCount > 0 ? 'text-slate-600 font-medium' : 'text-slate-500'
                        }`}>
                          {formatLevel(conversation.otherParticipant.level)}
                        </span>
                        {conversation.otherParticipant.verified && (
                          <span className="text-xs text-[#FFC107]">✓</span>
                        )}
                      </div>
                      <p className={`text-sm truncate ${
                        conversation.unreadCount > 0 ? 'text-slate-800 font-medium' : 'text-slate-500'
                      }`}>
                        {conversation.lastMessage?.content || 'No messages yet'}
                      </p>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <div className="flex-shrink-0 ml-2">
                        <div className="h-6 min-w-[24px] px-2 bg-[#043658] text-white text-xs font-semibold rounded-full flex items-center justify-center">
                          {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                <p className="text-slate-600 font-medium">No conversations found</p>
                <p className="text-sm text-slate-500 mt-1">Try searching for another teacher</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <MessageCircle className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                <h2 className="text-xl font-semibold text-slate-700 mb-2">No messages yet</h2>
                <p className="text-slate-500 mb-6">
                  Connect with other teachers to start private conversations.
                </p>
                <button
                  onClick={() => router.push('/community')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#043658] text-white rounded-lg hover:bg-[#043658]/90 transition-colors"
                >
                  <Users className="h-4 w-4" />
                  Find Teachers
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
