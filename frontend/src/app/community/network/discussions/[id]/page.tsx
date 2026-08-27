'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Bookmark,
  Share2,
  MoreVertical,
  Edit2,
  Trash2,
  Flag,
  Users,
  Clock,
  BadgeCheck,
} from 'lucide-react';
import { DashboardSidebar } from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { Avatar } from '@/components/common/Avatar';
import { useDiscussion, useToggleBookmark, useDeleteDiscussion } from '@/hooks/useDiscussions';
import { useDiscussionSocket } from '@/hooks/useDiscussionSocket';
import { useAuth } from '@/context/AuthContext';
import { DiscussionMessage as MessageComponent } from '@/components/discussion/DiscussionMessage';
import { MessageComposer } from '@/components/discussion/MessageComposer';
import Button from '@/components/ui/Button';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export default function DiscussionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const discussionId = params.id as string;

  const [showActions, setShowActions] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; senderName: string; content: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const { data: discussion, isLoading, error } = useDiscussion(discussionId);
  const toggleBookmark = useToggleBookmark();
  const deleteDiscussion = useDeleteDiscussion();

  const userName = user ? `${user.firstName} ${user.lastName}` : '';

  const {
    isConnected,
    isReconnecting,
    messages,
    onlineCount,
    typingUsers,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleHelpful,
    startTyping,
    stopTyping,
  } = useDiscussionSocket({
    discussionId,
    onMessageReceived: () => {
      // Auto-scroll if user is near bottom
      if (messagesContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        if (isNearBottom) {
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      }
    },
  });

  // Scroll to bottom on initial load
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 100);
    }
  }, [messages.length > 0]);

  const handleSendMessage = (content: string, replyToId?: string) => {
    sendMessage(content, replyToId);
    setReplyTo(null);
  };

  const handleReply = (messageId: string, senderName: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (message) {
      setReplyTo({
        id: messageId,
        senderName,
        content: message.content,
      });
    }
  };

  const handleEdit = (messageId: string, content: string) => {
    editMessage(messageId, content);
  };

  const handleDelete = (messageId: string) => {
    if (confirm('Are you sure you want to delete this message?')) {
      deleteMessage(messageId);
    }
  };

  const handleReport = (messageId: string) => {
    toast.info('Report feature coming soon');
  };

  const handleToggleBookmark = () => {
    toggleBookmark.mutate(discussionId);
  };

  const handleDeleteDiscussion = async () => {
    if (confirm('Are you sure you want to delete this discussion? This action cannot be undone.')) {
      try {
        await deleteDiscussion.mutateAsync(discussionId);
        router.push('/community/network/discussions');
      } catch (error) {
        // Error already handled by mutation
      }
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: discussion?.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto">
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-[#043658]" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !discussion) {
    return (
      <div className="flex h-screen bg-gray-50">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 py-8">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-900">Discussion not found</p>
                  <p className="text-sm text-red-700 mt-1">
                    This discussion may have been deleted or you don't have access to it.
                  </p>
                  <Button
                    onClick={() => router.push('/community/network/discussions')}
                    variant="secondary"
                    className="mt-4"
                  >
                    Back to Discussions
                  </Button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const authorName = `${discussion.author.firstName} ${discussion.author.lastName}`;
  const createdAgo = formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true });

  return (
    <div className="h-screen overflow-hidden bg-[#F5F8FB]">
      <DashboardSidebar />
      <Topbar />
      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-hidden flex">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Compact Header */}
            <div className="bg-white border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2 mb-2 text-xs">
                <button
                  onClick={() => router.push('/community')}
                  className="flex items-center gap-1.5 text-slate-600 hover:text-[#043658] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Discussions
                </button>
              </div>

              {/* Title and metadata */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold text-[#043658] mb-1.5 line-clamp-2">{discussion.title}</h1>
                  
                  {/* Compact metadata row */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Avatar profileImage={discussion.author.profileImage} name={authorName} size="sm" />
                      <span className="font-medium text-slate-700">{authorName}</span>
                      {discussion.author.verified && (
                        <BadgeCheck className="w-3 h-3 text-[#FFC107]" />
                      )}
                    </span>
                    <span>·</span>
                    <span>{createdAgo}</span>
                    <span>·</span>
                    <span>{discussion.replyCount} {discussion.replyCount === 1 ? 'reply' : 'replies'}</span>
                    <span>·</span>
                    <span>{discussion.views} {discussion.views === 1 ? 'view' : 'views'}</span>
                    {discussion.category && (
                      <>
                        <span>·</span>
                        <span className="px-2 py-0.5 bg-[#043658]/5 text-[#043658] rounded-full font-medium">{discussion.category.name}</span>
                      </>
                    )}
                  </div>

                  {/* Connection status */}
                  {!isConnected && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                      {isReconnecting ? '🔄 Reconnecting...' : '⚠️ Disconnected'}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={handleToggleBookmark}
                    className={`p-1.5 rounded-lg transition-colors ${
                      discussion.isBookmarked
                        ? 'text-[#FFC107] bg-[#FFC107]/10'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    title={discussion.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                    title="Share"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  {discussion.isOwner && (
                    <div className="relative">
                      <button
                        onClick={() => setShowActions(!showActions)}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {showActions && (
                        <>
                          <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                            <button
                              onClick={() => {
                                router.push(`/community/network/discussions/${discussionId}/edit`);
                                setShowActions(false);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                handleDeleteDiscussion();
                                setShowActions(false);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                          <div className="fixed inset-0 z-0" onClick={() => setShowActions(false)} />
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto bg-slate-50 p-4"
            >
              <div className="max-w-4xl mx-auto space-y-4">
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <MessageComponent
                      key={message.id}
                      message={message}
                      discussionId={discussionId}
                      discussionTitle={discussion.title}
                      onReply={handleReply}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onHelpful={toggleHelpful}
                      onReport={handleReport}
                    />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-[#043658]/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-[#043658]" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">No replies yet</h3>
                    <p className="text-xs text-slate-600">Be the first teacher to join the conversation.</p>
                  </div>
                )}

                {/* Typing Indicator */}
                {typingUsers.length > 0 && (
                  <div className="text-xs text-slate-500 italic px-2">
                    {typingUsers.length === 1
                      ? `${typingUsers[0]} is typing...`
                      : `${typingUsers[0]} and ${typingUsers.length - 1} ${
                          typingUsers.length === 2 ? 'other' : 'others'
                        } are typing...`}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Composer */}
            <div className="bg-white border-t border-slate-200 px-4 py-3">
              <MessageComposer
                onSend={handleSendMessage}
                onTypingStart={() => startTyping(userName)}
                onTypingStop={stopTyping}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block w-72 bg-white border-l border-slate-200 overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Active Now */}
              <div className="bg-slate-50 rounded-lg p-3">
                <h3 className="text-xs font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Active Now
                </h3>
                <p className="text-xs text-slate-600">
                  {onlineCount} {onlineCount === 1 ? 'teacher' : 'teachers'} viewing
                </p>
                {typingUsers.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <p className="text-xs text-slate-500 italic">
                      {typingUsers[0]} typing...
                    </p>
                  </div>
                )}
              </div>

              {/* Category */}
              {discussion.category && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <h3 className="text-xs font-semibold text-slate-900 mb-2">Category</h3>
                  <span className="inline-flex items-center px-2 py-1 bg-[#043658]/5 text-[#043658] text-xs font-medium rounded-full">
                    {discussion.category.name}
                  </span>
                </div>
              )}

              {/* Tags */}
              {discussion.tags.length > 0 && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <h3 className="text-xs font-semibold text-slate-900 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {discussion.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-white text-slate-600 text-xs rounded-full border border-slate-200">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
    </div>
  );
}
