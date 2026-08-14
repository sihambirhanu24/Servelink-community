'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Send,
  Loader,
  Users,
  Wifi,
  WifiOff,
  Search,
  MoreVertical,
  Pin,
  AlertCircle,
} from 'lucide-react';
import { DashboardSidebar } from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { useAuth } from '@/context/AuthContext';
import {
  chatSocket,
  fetchChatMessages,
  fetchChatInfo,
  type ChatMessage,
  type ChatCommunityInfo,
} from '@/services/chat';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

function shouldShowDateSeparator(prev: ChatMessage | undefined, curr: ChatMessage): boolean {
  if (!prev) return true;
  return new Date(prev.createdAt).toDateString() !== new Date(curr.createdAt).toDateString();
}

const LEVEL_LABEL: Record<string, string> = {
  LEVEL_1: 'L1',
  LEVEL_2: 'L2',
  LEVEL_3: 'L3',
  LEVEL_4: 'L4',
  LEVEL_5: 'L5',
};

const TYPE_COLOUR: Record<string, string> = {
  SCHOOL: 'bg-blue-600',
  WOREDA: 'bg-emerald-600',
  ZONE: 'bg-amber-600',
  REGION: 'bg-purple-600',
  NATIONAL: 'bg-rose-600',
};

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  name,
  image,
  level,
  size = 'md',
}: {
  name: string;
  image?: string | null;
  level?: string;
  size?: 'sm' | 'md';
}) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const dim = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className={`${dim} rounded-full object-cover flex-shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${dim} rounded-full bg-[#043658] text-white font-semibold flex items-center justify-center flex-shrink-0`}
    >
      {initials}
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  message,
  isOwn,
}: {
  message: ChatMessage;
  isOwn: boolean;
}) {
  return (
    <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isOwn && (
        <Avatar
          name={message.senderName}
          image={message.senderProfileImage}
          level={message.senderLevel}
          size="sm"
        />
      )}
      <div className={`max-w-[72%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {!isOwn && (
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs font-semibold text-slate-700">{message.senderName}</span>
            <span className="text-[10px] text-slate-400 bg-slate-100 px-1 rounded">
              {LEVEL_LABEL[message.senderLevel] ?? message.senderLevel}
            </span>
          </div>
        )}
        <div
          className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words ${
            isOwn
              ? 'bg-[#043658] text-white rounded-tr-sm'
              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
          }`}
        >
          {message.content}
          {message.editedAt && (
            <span className={`ml-1 text-[10px] ${isOwn ? 'text-white/60' : 'text-slate-400'}`}>
              (edited)
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[10px] text-slate-400">{formatTime(message.createdAt)}</span>
          {message.isPinned && <Pin className="w-2.5 h-2.5 text-amber-500" />}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ChatRoomPage() {
  const { communityId } = useParams<{ communityId: string }>();
  const router = useRouter();
  const { user, token } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Community info
  const [info, setInfo] = useState<ChatCommunityInfo | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);

  // Messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Input
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  // Socket
  const [connected, setConnected] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);

  // Sidebar
  const [showSidebar, setShowSidebar] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const seenIds = useRef(new Set<string>());

  const scrollToBottom = useCallback((smooth = false) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
  }, []);

  // ── Load community info ────────────────────────────────────────────────────
  useEffect(() => {
    if (!communityId) return;
    fetchChatInfo(communityId)
      .then(setInfo)
      .catch((e) => setInfoError(e?.response?.data?.message ?? 'Failed to load community info'));
  }, [communityId]);

  // ── Load initial messages via REST ─────────────────────────────────────────
  useEffect(() => {
    if (!communityId || !token) return;
    setLoadingMessages(true);
    fetchChatMessages(communityId, 1, 50)
      .then(({ messages: msgs, total: t }) => {
        seenIds.current = new Set(msgs.map((m) => m.id));
        setMessages(msgs);
        setTotal(t);
        setPage(1);
      })
      .catch(() => {})
      .finally(() => {
        setLoadingMessages(false);
        setTimeout(() => scrollToBottom(), 100);
      });
  }, [communityId, token, scrollToBottom]);

  // ── Load older messages ───────────────────────────────────────────────────
  const loadOlderMessages = useCallback(async () => {
    if (!communityId || loadingMore || messages.length >= total) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { messages: older } = await fetchChatMessages(communityId, nextPage, 50);
      const fresh = older.filter((m) => !seenIds.current.has(m.id));
      fresh.forEach((m) => seenIds.current.add(m.id));
      setMessages((prev) => [...fresh, ...prev]);
      setPage(nextPage);
    } finally {
      setLoadingMore(false);
    }
  }, [communityId, loadingMore, messages.length, total, page]);

  // Scroll-to-top triggers loading older messages
  const handleScroll = useCallback(() => {
    const el = messagesRef.current;
    if (el && el.scrollTop < 80 && !loadingMore && messages.length < total) {
      loadOlderMessages();
    }
  }, [loadingMore, messages.length, total, loadOlderMessages]);

  // ── Socket.IO setup ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!communityId || !token) return;

    let mounted = true;

    const onConnected = () => {
      if (mounted) {
        setConnected(true);
        chatSocket.joinCommunity(communityId);
      }
    };

    const onDisconnected = () => { if (mounted) setConnected(false); };

    const onJoined = (payload: any) => {
      if (!mounted) return;
      setOnlineCount(payload.onlineCount ?? null);
      setJoinError(null);
    };

    const onNewMessage = (msg: ChatMessage) => {
      if (!mounted) return;
      if (seenIds.current.has(msg.id)) return; // deduplicate
      seenIds.current.add(msg.id);
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => scrollToBottom(true), 50);
    };

    const onMessageUpdated = (updated: ChatMessage) => {
      if (!mounted) return;
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    };

    const onMessageDeleted = ({ messageId }: { messageId: string }) => {
      if (!mounted) return;
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    };

    const onPresence = (data: { communityId: string; onlineCount: number }) => {
      if (mounted && data.communityId === communityId) setOnlineCount(data.onlineCount);
    };

    const onError = (err: { code?: string; message: string }) => {
      if (!mounted) return;
      if (err.code === 'FORBIDDEN') setJoinError(err.message);
    };

    chatSocket.on('connected', onConnected);
    chatSocket.on('disconnected', onDisconnected);
    chatSocket.on('community:joined', onJoined);
    chatSocket.on('message:new', onNewMessage);
    chatSocket.on('message:updated', onMessageUpdated);
    chatSocket.on('message:deleted', onMessageDeleted);
    chatSocket.on('presence:update', onPresence);
    chatSocket.on('error', onError);

    if (chatSocket.isConnected()) {
      setConnected(true);
      chatSocket.joinCommunity(communityId);
    } else {
      chatSocket.connect(token).catch(() => {});
    }

    return () => {
      mounted = false;
      chatSocket.leaveCommunity(communityId);
      chatSocket.off('connected', onConnected);
      chatSocket.off('disconnected', onDisconnected);
      chatSocket.off('community:joined', onJoined);
      chatSocket.off('message:new', onNewMessage);
      chatSocket.off('message:updated', onMessageUpdated);
      chatSocket.off('message:deleted', onMessageDeleted);
      chatSocket.off('presence:update', onPresence);
      chatSocket.off('error', onError);
    };
  }, [communityId, token, scrollToBottom]);

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const content = input.trim();
    if (!content || sending || !connected) return;
    setSending(true);
    chatSocket.sendMessage(communityId, content);
    setInput('');
    setSending(false);
    inputRef.current?.focus();
  }, [input, sending, connected, communityId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // ─────────────────────────────────────────────────────────────────────────

  const typeColour = info
    ? (TYPE_COLOUR[info.community.type] ?? 'bg-[#043658]')
    : 'bg-[#043658]';

  return (
    <div className="h-screen overflow-hidden bg-slate-50">
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] flex">
        {/* ── Chat column ── */}
        <div className="flex flex-col flex-1 min-w-0 bg-white">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-white shrink-0">
            <Link
              href="/community/chat"
              className="text-slate-500 hover:text-[#043658] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>

            {/* Avatar */}
            <div
              className={`w-9 h-9 rounded-full ${typeColour} text-white font-bold text-sm flex items-center justify-center shrink-0`}
            >
              {info?.community.name.slice(0, 2).toUpperCase() ?? '…'}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-slate-900 truncate">
                {info?.community.name ?? 'Loading…'}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{info?.community.type ?? ''} Community</span>
                {onlineCount !== null && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      {onlineCount} online
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {connected ? (
                <Wifi className="w-4 h-4 text-emerald-500" aria-label="Connected" />
              ) : (
                <WifiOff className="w-4 h-4 text-slate-400" aria-label="Disconnected" />
              )}
              <button
                onClick={() => setShowSidebar((v) => !v)}
                className="text-slate-400 hover:text-[#043658] transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Access error */}
          {(infoError || joinError) && (
            <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {infoError ?? joinError}
            </div>
          )}

          {/* Messages area */}
          <div
            ref={messagesRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
          >
            {loadingMore && (
              <div className="flex justify-center py-2">
                <Loader className="w-4 h-4 animate-spin text-slate-400" />
              </div>
            )}

            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader className="w-6 h-6 animate-spin mx-auto text-slate-300 mb-2" />
                  <p className="text-xs text-slate-400">Loading messages…</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-4xl mb-3">💬</div>
                  <p className="text-sm font-medium text-slate-600">No messages yet</p>
                  <p className="text-xs text-slate-400 mt-1">Be the first to say something!</p>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={msg.id}>
                  {shouldShowDateSeparator(messages[idx - 1], msg) && (
                    <div className="flex items-center gap-3 py-2">
                      <div className="flex-1 h-px bg-slate-100" />
                      <span className="text-xs text-slate-400 font-medium">
                        {formatDateLabel(msg.createdAt)}
                      </span>
                      <div className="flex-1 h-px bg-slate-100" />
                    </div>
                  )}
                  <MessageBubble
                    message={msg}
                    isOwn={msg.senderId === user?.id}
                  />
                </div>
              ))
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-slate-100 bg-white shrink-0">
            {!connected && (
              <p className="text-xs text-amber-600 text-center mb-2 flex items-center justify-center gap-1">
                <WifiOff className="w-3 h-3" /> Reconnecting…
              </p>
            )}
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={connected ? 'Type a message… (Enter to send)' : 'Connecting…'}
                disabled={!connected}
                rows={1}
                className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#043658]/30 focus:border-[#043658] transition disabled:opacity-50 max-h-32 overflow-y-auto"
                style={{ lineHeight: '1.5' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || !connected || sending}
                className="w-10 h-10 rounded-xl bg-[#043658] text-white flex items-center justify-center hover:bg-[#043658]/90 disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
                title="Send (Enter)"
              >
                {sending ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 ml-1">
              Shift + Enter for new line
            </p>
          </div>
        </div>

        {/* ── Right sidebar ── */}
        {showSidebar && info && (
          <aside className="w-72 shrink-0 border-l border-slate-100 bg-white overflow-y-auto hidden lg:block">
            <div className="p-5 border-b border-slate-100">
              <div
                className={`w-16 h-16 rounded-full ${typeColour} text-white font-bold text-xl flex items-center justify-center mx-auto mb-3`}
              >
                {info.community.name.slice(0, 2).toUpperCase()}
              </div>
              <h2 className="text-sm font-bold text-slate-900 text-center">
                {info.community.name}
              </h2>
              <p className="text-xs text-slate-500 text-center mt-0.5">
                {info.community.type} Community
              </p>
            </div>

            <div className="p-5 space-y-4 text-sm text-slate-700">
              {info.community.description && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                    About
                  </p>
                  <p className="text-xs text-slate-600">{info.community.description}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Details
                </p>
                <div className="space-y-1.5 text-xs text-slate-600">
                  {info.community.school && (
                    <div className="flex gap-2">
                      <span className="text-slate-400 w-14 shrink-0">School</span>
                      <span>{info.community.school}</span>
                    </div>
                  )}
                  {info.community.woreda && (
                    <div className="flex gap-2">
                      <span className="text-slate-400 w-14 shrink-0">Woreda</span>
                      <span>{info.community.woreda}</span>
                    </div>
                  )}
                  {info.community.zone && (
                    <div className="flex gap-2">
                      <span className="text-slate-400 w-14 shrink-0">Zone</span>
                      <span>{info.community.zone}</span>
                    </div>
                  )}
                  {info.community.region && (
                    <div className="flex gap-2">
                      <span className="text-slate-400 w-14 shrink-0">Region</span>
                      <span>{info.community.region}</span>
                    </div>
                  )}
                </div>
              </div>

              {onlineCount !== null && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                    Presence
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{onlineCount} online now</span>
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Stats
                </p>
                <div className="text-xs text-slate-600">
                  <span>{messages.length} messages loaded</span>
                  {total > messages.length && (
                    <button
                      onClick={loadOlderMessages}
                      className="block mt-1 text-[#043658] hover:underline"
                    >
                      Load older messages ({total - messages.length} more)
                    </button>
                  )}
                </div>
              </div>
            </div>
          </aside>
        )}
      </main>
    </div>
  );
}
