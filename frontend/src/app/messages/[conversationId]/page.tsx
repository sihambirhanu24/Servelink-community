'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, MoreVertical, Paperclip, AlertCircle, BadgeCheck, Loader2, Reply, X, Image as ImageIcon, Video } from 'lucide-react';
import { useDirectConversationMessages, useSendDirectMessage } from '@/hooks/useDirectMessages';
import { useDirectMessagesSocket } from '@/hooks/useDirectMessagesSocket';
import { useAuth } from '@/context/AuthContext';
import { DashboardSidebar } from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import Avatar from '@/components/ui/Avatar';
import { formatDistanceToNow } from 'date-fns';
import type { DirectMessage } from '@/services/direct-messages';
import type { DirectConversationParticipant } from '@/services/direct-messages';
import { uploadDirectMessageAttachment } from '@/services/direct-messages';

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const chatRoomId = params.conversationId as string;
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<DirectMessage | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [attachmentUrls, setAttachmentUrls] = useState<Array<{ url: string; type: string }>>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: messagesData, isLoading, error: loadError } = useDirectConversationMessages(chatRoomId);
  const sendMessage = useSendDirectMessage();

  const { isConnected, otherUserOnline } = useDirectMessagesSocket(chatRoomId);

  const messages = messagesData?.messages || [];
  // Reverse messages to show oldest first (newest at bottom)
  const orderedMessages = [...messages].reverse();
  const otherParticipant = messagesData?.otherParticipant;

  useEffect(() => {
    if (loadError) {
      setError('Failed to load messages. Please try again.');
    }
  }, [loadError]);

  useEffect(() => {
    scrollToBottom();
  }, [orderedMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleReply = (message: DirectMessage) => {
    setReplyingTo(message);
    // Focus the input
    const textarea = document.querySelector('textarea');
    textarea?.focus();
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    const trimmed = messageInput.trim();
    const hasFiles = selectedFiles.length > 0;

    if (!trimmed && !hasFiles) return;

    setError(null);
    setMessageInput('');
    const replyToId = replyingTo?.id;

    try {
      // Upload files first if any
      if (hasFiles) {
        setUploadingFiles(true);
        try {
          const uploadPromises = selectedFiles.map(file => uploadDirectMessageAttachment(file));
          const uploadedFiles = await Promise.all(uploadPromises);
          setAttachmentUrls(uploadedFiles);
          setSelectedFiles([]);
        } catch (uploadErr) {
          console.error('Upload failed:', uploadErr);
          setError('Failed to upload files. Please try again.');
          setMessageInput(trimmed);
          setUploadingFiles(false);
          return;
        }
        setUploadingFiles(false);
      }

      await sendMessage.mutateAsync({ 
        chatRoomId, 
        content: trimmed || '', 
        replyToId,
        attachmentUrls: attachmentUrls.length > 0 ? attachmentUrls.map(a => a.url) : undefined
      });
      setReplyingTo(null);
      setAttachmentUrls([]);
    } catch (err) {
      console.error('Send message failed:', err);
      setError('Failed to send message. Please try again.');
      setMessageInput(trimmed);
      setUploadingFiles(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);
    
    // Typing indicator
    if (!isTyping) {
      setIsTyping(true);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const handleProfileClick = () => {
    if (otherParticipant?.id) {
      router.push(`/profile/${otherParticipant.id}`);
    }
  };

  const formatLevel = (level: string) => {
    return level.replace(/^LEVEL_/, 'Level ').replace(/_/g, ' ');
  };

  const teacherName = otherParticipant 
    ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
    : 'Teacher';

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen overflow-hidden bg-[#F5F8FB]">
        <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#043658] mb-4" />
            <p className="text-sm text-slate-600">Loading conversation...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#F5F8FB]">
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
        {/* Conversation Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </button>

            {otherParticipant && (
              <button
                onClick={handleProfileClick}
                className="flex items-center gap-3 flex-1 min-w-0 hover:bg-slate-50 rounded-lg px-3 py-2 transition-colors"
              >
                <Avatar
                  image={otherParticipant.profileImage || undefined}
                  name={teacherName}
                  className="h-12 w-12 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-[#043658] truncate">{teacherName}</h2>
                    {otherParticipant.verified && (
                      <BadgeCheck className="h-4 w-4 text-[#FFC107] flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    {otherUserOnline ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <span className="inline-block w-2 h-2 bg-green-600 rounded-full"></span>
                        Online
                      </span>
                    ) : (
                      <span className="text-slate-400 flex items-center gap-1">
                        <span className="inline-block w-2 h-2 bg-slate-400 rounded-full"></span>
                        Offline
                      </span>
                    )}
                    <span>·</span>
                    <span className="truncate">{formatLevel(otherParticipant.level)}</span>
                    {otherParticipant.profession && (
                      <>
                        <span>·</span>
                        <span className="hidden sm:inline truncate">{otherParticipant.profession}</span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            )}

            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <MoreVertical className="h-5 w-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center gap-2 flex-shrink-0">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-sm text-red-700 hover:text-red-900"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Messages Container */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 bg-slate-50">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-slate-600 font-medium">Start the conversation 👋</p>
                <p className="text-sm text-slate-500 mt-1">
                  Send a message to {teacherName} to connect.
                </p>
              </div>
            </div>
          ) : (
            <>
              {orderedMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.senderId === user?.id}
                  onReply={handleReply}
                />
              ))}
              {isTyping && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
                  </div>
                  <span>typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input Composer */}
        <div className="bg-white border-t border-slate-200 px-6 py-4 flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            {/* Reply Preview */}
            {replyingTo && (
              <div className="mb-3 flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <Reply className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 font-medium">
                    Replying to {replyingTo.senderName}
                  </p>
                  <p className="text-sm text-slate-700 truncate">
                    {replyingTo.content}
                  </p>
                </div>
                <button
                  onClick={handleCancelReply}
                  className="p-1 hover:bg-slate-200 rounded transition-colors"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            )}

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="h-16 w-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="h-16 w-16 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Video className="h-6 w-6 text-slate-400" />
                      </div>
                    )}
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
                disabled={uploadingFiles}
              >
                <Paperclip className="h-5 w-5 text-slate-600" />
              </button>

              <div className="flex-1 min-w-0">
                <textarea
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={replyingTo ? "Write a reply..." : "Type a message..."}
                  rows={1}
                  disabled={uploadingFiles}
                  className="w-full px-4 py-3 bg-slate-100 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:bg-white transition-colors disabled:opacity-50"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
              </div>

              <button
                onClick={handleSendMessage}
                disabled={(!messageInput.trim() && selectedFiles.length === 0) || sendMessage.isPending || uploadingFiles}
                className="p-3 bg-[#043658] text-white rounded-xl hover:bg-[#043658]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                {uploadingFiles ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

interface MessageBubbleProps {
  message: DirectMessage;
  isOwn: boolean;
  onReply?: (message: DirectMessage) => void;
}

function MessageBubble({ message, isOwn, onReply }: MessageBubbleProps) {
  const hasAttachments = message.attachments && message.attachments.length > 0;
  const hasContent = message.content && message.content.trim().length > 0;

  const getAttachmentUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `${process.env.NEXT_PUBLIC_API_URL}${url}`;
  };

  const isImageOnly = hasAttachments && !hasContent && message.attachments.length === 1 && message.attachments[0].type === 'IMAGE';

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
      <div
        className={`relative overflow-hidden ${
          isImageOnly
            ? 'rounded-2xl max-w-[70%]'
            : `max-w-[70%] rounded-2xl px-4 py-2.5 ${
                isOwn
                  ? 'bg-[#043658] text-white rounded-br-sm'
                  : 'bg-white border border-slate-200 text-slate-900 rounded-bl-sm shadow-sm'
              }`
        }`}
      >
        {/* Attachments */}
        {hasAttachments && (
          <div className={`${hasContent ? 'mb-2 space-y-2' : ''}`}>
            {message.attachments.map((attachment: any) => (
              <div key={attachment.id} className="relative">
                {attachment.type === 'IMAGE' ? (
                  <img
                    src={getAttachmentUrl(attachment.url)}
                    alt={attachment.fileName}
                    className={`rounded-lg cursor-pointer hover:opacity-90 transition-opacity ${
                      isImageOnly ? 'w-full h-auto' : 'max-w-full'
                    }`}
                    onClick={() => window.open(getAttachmentUrl(attachment.url), '_blank')}
                  />
                ) : attachment.type === 'VIDEO' ? (
                  <video
                    src={getAttachmentUrl(attachment.url)}
                    controls
                    className="max-w-full rounded-lg"
                  />
                ) : (
                  <a
                    href={getAttachmentUrl(attachment.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    <ImageIcon className="h-4 w-4" />
                    <span className="text-sm">{attachment.fileName}</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Message content */}
        {hasContent && (
          <p className="break-words text-sm">{message.content}</p>
        )}

        {/* Timestamp and actions */}
        <div className={`flex items-center gap-2 mt-1 ${isOwn ? 'justify-end' : 'justify-start'} ${isImageOnly ? 'absolute bottom-2 right-2 bg-black/50 px-2 py-1 rounded-lg' : ''}`}>
          <span className={`text-xs ${isOwn ? 'text-white/70' : 'text-slate-500'} ${isImageOnly ? 'text-white' : ''}`}>
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
          </span>
          {isOwn && (
            <span className={`text-xs ${isOwn ? 'text-white/70' : 'text-slate-500'} ${isImageOnly ? 'text-white' : ''}`}>✓✓</span>
          )}
          {!isOwn && onReply && !isImageOnly && (
            <button
              onClick={() => onReply(message)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded"
              title="Reply"
            >
              <Reply className="h-3 w-3 text-slate-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
