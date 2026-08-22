'use client';

/**
 * /community/type/[type]/chat/[dept]
 *
 * Department-scoped real-time chat room.
 *
 * Resolution flow:
 *   1. Decode `dept` URL param → department name (e.g. "Mathematics")
 *   2. Call GET /api/chat/groups → find the group whose
 *      type matches (case-insensitive) AND department matches
 *   3. Extract communityId from that group
 *   4. Load REST message history → GET /api/community/:id/chat/messages
 *   5. Connect Socket.IO /chat namespace
 *   6. Emit community:join with the communityId
 *   7. Stream real-time messages via message:new / message:updated / message:deleted
 *
 * Zero fake data. Zero hardcoded messages.
 */

import { use, useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Send,
  Loader,
  Wifi,
  WifiOff,
  MoreVertical,
  AlertCircle,
  RefreshCw,
  Users,
  Pin,
  BookOpen,
} from 'lucide-react';
import { DashboardSidebar } from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { useAuth } from '@/context/AuthContext';
import {
  chatSocket,
  fetchAccessibleChatGroups,
  fetchChatMessages,
  type ChatMessage,
  type ChatGroup,
} from '@/services/chat';

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  school: 'School',
  woreda: 'Woreda',
  zone: 'Zone',
  region: 'Regional',
  national: 'National',
  SCHOOL: 'School',
  WOREDA: 'Woreda',
  ZONE: 'Zone',
  REGION: 'Regional',
  NATIONAL: 'National',
};

const TYPE_COLOUR: Record<string, string> = {
  school: 'bg-blue-600',
  woreda: 'bg-emerald-600',
  zone: 'bg-amber-600',
  region: 'bg-purple-600',
  national: 'bg-rose-600',
  SCHOOL: 'bg-blue-600',
  WOREDA: 'bg-emerald-600',
  ZONE: 'bg-amber-600',
  REGION: 'bg-purple-600',
  NATIONAL: 'bg-rose-600',
};

const LEVEL_SHORT: Record<string, string> = {
  LEVEL_1: 'L1',
  LEVEL_2: 'L2',
  LEVEL_3: 'L3',
  LEVEL_4: 'L4',
  LEVEL_5: 'L5',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtDateLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

function needsDateSep(prev: ChatMessage | undefined, curr: ChatMessage) {
  if (!prev) return true;
  return (
    new Date(prev.createdAt).toDateString() !== new Date(curr.createdAt).toDateString()
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, image }: { name: string; image?: string | null }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-[#043658] text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
      {initials}
    </div>
  );
}

// ─── Bubble ───────────────────────────────────────────────────────────────────

function Bubble({ msg, isOwn }: { msg: ChatMessage; isOwn: boolean }) {
  if (msg.deletedAt) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <p className="text-xs italic text-slate-400 px-2">This message was deleted</p>
      </div>
    );
  }

  return (
    <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isOwn && <Avatar name={msg.senderName} image={msg.senderProfileImage} />}
      <div className={`max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs font-semibold text-slate-700">{msg.senderName}</span>
            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
              {LEVEL_SHORT[msg.senderLevel] ?? msg.senderLevel}
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
          {msg.content}
          {msg.editedAt && (
            <span className={`ml-1 text-[10px] ${isOwn ? 'text-white/60' : 'text-slate-400'}`}>
              (edited)
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] text-slate-400">{fmtTime(msg.createdAt)}</span>
          {msg.isPinned && <Pin className="w-2.5 h-2.5 text-amber-500" />}
        </div>

        {/* Reactions */}
        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(msg.reactions).map(([emoji, count]) => (
              <span
                key={emoji}
                className="text-xs bg-slate-100 rounded-full px-2 py-0.5 border border-slate-200"
              >
                {emoji} {count}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ type: string; dept: string }>;
}

export default function DeptChatPage({ params }: Props) {
  const { type, dept } = use(params);
  const { user, token } = useAuth();

  // Decode URL param → department label (e.g. "Mathematics")
  const deptLabel = decodeURIComponent(dept);
  const typeLabel = TYPE_LABEL[type] ?? type;
  const typeColour = TYPE_COLOUR[type] ?? 'bg-[#043658]';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // ── Step 1: resolve communityId from accessible groups ────────────────────
  const [communityId, setCommunityId] = useState<string | null>(null);
  const [communityName, setCommunityName] = useState('');
  const [group, setGroup] = useState<ChatGroup | null>(null);
  const [resolving, setResolving] = useState(true);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const resolve = useCallback(async () => {
    if (!token) return;
    setResolving(true);
    setResolveError(null);
    try {
      const groups = await fetchAccessibleChatGroups();

      // Match: type (case-insensitive) AND subtype === DEPARTMENT AND department matches
      const match = groups.find((g) => {
        const typeMatches =
          g.type.toUpperCase() === type.toUpperCase();
        const deptMatches =
          g.subtype === 'DEPARTMENT' &&
          g.department?.toLowerCase() === deptLabel.toLowerCase();
        return typeMatches && deptMatches;
      });

      if (!match) {
        setResolveError(
          `No ${deptLabel} department community found for your ${typeLabel} level. ` +
            `Make sure your profile has the correct department, level, and location set.`,
        );
        return;
      }

      setCommunityId(match.id);
      setCommunityName(match.name);
      setGroup(match);
    } catch (e: any) {
      setResolveError(
        e?.response?.data?.message ??
          `Failed to load the ${deptLabel} department community.`,
      );
    } finally {
      setResolving(false);
    }
  }, [token, type, deptLabel, typeLabel]);

  useEffect(() => {
    resolve();
  }, [resolve]);

  // ── Step 2: load REST message history ─────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const seenIds = useRef(new Set<string>());

  useEffect(() => {
    if (!communityId) return;
    setLoadingMsgs(true);
    seenIds.current.clear();
    fetchChatMessages(communityId, 1, 50)
      .then(({ messages: msgs, total: t }) => {
        msgs.forEach((m) => seenIds.current.add(m.id));
        setMessages(msgs);
        setTotal(t);
        setPage(1);
        setTimeout(() => scrollBottom(), 80);
      })
      .catch(() => {})
      .finally(() => setLoadingMsgs(false));
  }, [communityId]);

  const loadOlder = useCallback(async () => {
    if (!communityId || loadingMore || messages.length >= total) return;
    setLoadingMore(true);
    try {
      const np = page + 1;
      const { messages: older } = await fetchChatMessages(communityId, np, 50);
      const fresh = older.filter((m) => !seenIds.current.has(m.id));
      fresh.forEach((m) => seenIds.current.add(m.id));
      setMessages((prev) => [...fresh, ...prev]);
      setPage(np);
    } finally {
      setLoadingMore(false);
    }
  }, [communityId, loadingMore, messages.length, total, page]);

  // ── Scroll refs ───────────────────────────────────────────────────────────
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesEl = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollBottom = useCallback((smooth = false) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
  }, []);

  const handleScroll = useCallback(() => {
    const el = messagesEl.current;
    if (el && el.scrollTop < 80) loadOlder();
  }, [loadOlder]);

  // ── Step 3: Socket.IO ─────────────────────────────────────────────────────
  const [connected, setConnected] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!communityId || !token) return;
    let mounted = true;

    const onConn = () => {
      if (!mounted) return;
      setConnected(true);
      chatSocket.joinCommunity(communityId);
    };
    const onDisc = () => {
      if (mounted) setConnected(false);
    };
    const onJoined = (p: any) => {
      if (!mounted) return;
      setOnlineCount(p.onlineCount ?? null);
      setJoinError(null);
    };
    const onNew = (msg: ChatMessage) => {
      if (!mounted) return;
      if (seenIds.current.has(msg.id)) return;
      seenIds.current.add(msg.id);
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => scrollBottom(true), 40);
    };
    const onUpdated = (m: ChatMessage) => {
      if (mounted) setMessages((p) => p.map((x) => (x.id === m.id ? m : x)));
    };
    const onDeleted = ({ messageId }: { messageId: string }) => {
      if (mounted)
        setMessages((p) =>
          p.map((x) => (x.id === messageId ? { ...x, deletedAt: new Date().toISOString() } : x)),
        );
    };
    const onPresence = (d: { communityId: string; onlineCount: number }) => {
      if (mounted && d.communityId === communityId) setOnlineCount(d.onlineCount);
    };
    const onTypingStart = (d: { teacherId: string }) => {
      if (!mounted) return;
      setTypingUsers((prev) => [...new Set([...prev, d.teacherId])]);
    };
    const onTypingStop = (d: { teacherId: string }) => {
      if (!mounted) return;
      setTypingUsers((prev) => prev.filter((id) => id !== d.teacherId));
    };
    const onError = (e: { code?: string; message: string }) => {
      if (mounted && e.code === 'FORBIDDEN') setJoinError(e.message);
    };

    chatSocket.on('connected', onConn);
    chatSocket.on('disconnected', onDisc);
    chatSocket.on('community:joined', onJoined);
    chatSocket.on('message:new', onNew);
    chatSocket.on('message:updated', onUpdated);
    chatSocket.on('message:deleted', onDeleted);
    chatSocket.on('presence:update', onPresence);
    chatSocket.on('typing:started', onTypingStart);
    chatSocket.on('typing:stopped', onTypingStop);
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
      chatSocket.off('connected', onConn);
      chatSocket.off('disconnected', onDisc);
      chatSocket.off('community:joined', onJoined);
      chatSocket.off('message:new', onNew);
      chatSocket.off('message:updated', onUpdated);
      chatSocket.off('message:deleted', onDeleted);
      chatSocket.off('presence:update', onPresence);
      chatSocket.off('typing:started', onTypingStart);
      chatSocket.off('typing:stopped', onTypingStop);
      chatSocket.off('error', onError);
    };
  }, [communityId, token, scrollBottom]);

  // ── Typing indicator ──────────────────────────────────────────────────────
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      if (!communityId || !connected) return;
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        chatSocket.typingStart(communityId);
      }
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        isTypingRef.current = false;
        chatSocket.typingStop(communityId);
      }, 2500);
    },
    [communityId, connected],
  );

  // ── Send ──────────────────────────────────────────────────────────────────
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = useCallback(() => {
    const content = input.trim();
    if (!content || !connected || sending || !communityId) return;
    chatSocket.sendMessage(communityId, content);
    setInput('');
    if (typingTimer.current) clearTimeout(typingTimer.current);
    isTypingRef.current = false;
    chatSocket.typingStop(communityId);
    inputRef.current?.focus();
  }, [input, connected, sending, communityId]);

  const handleKey = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // ── Render states ─────────────────────────────────────────────────────────

  if (resolving) {
    return (
      <div className="h-screen overflow-hidden bg-slate-50">
        <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center">
            <Loader className="h-7 w-7 animate-spin mx-auto text-[#043658] mb-3" />
            <p className="text-sm text-slate-500">
              Loading {deptLabel} · {typeLabel} community…
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (resolveError) {
    return (
      <div className="h-screen overflow-hidden bg-slate-50">
        <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] flex items-center justify-center px-6">
          <div className="max-w-sm text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-7 w-7 text-slate-400" />
            </div>
            <h2 className="text-base font-semibold text-slate-800 mb-2">
              Community Unavailable
            </h2>
            <p className="text-sm text-slate-500 mb-6">{resolveError}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={resolve}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#043658] text-white text-sm rounded-lg hover:opacity-90"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
              <Link
                href={`/community/type/${type}`}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50"
              >
                Back
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Full chat UI ──────────────────────────────────────────────────────────
  return (
    <div className="h-screen overflow-hidden bg-slate-50">
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] flex">

        {/* ── Chat column ─────────────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0 bg-white">

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 shrink-0 bg-white">
            <Link
              href={`/community/type/${type}`}
              className="text-slate-400 hover:text-[#043658] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>

            {/* Avatar — department amber colour */}
            <div className="w-9 h-9 rounded-full bg-amber-500 text-white font-bold text-sm flex items-center justify-center shrink-0">
              {deptLabel.slice(0, 2).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-slate-900 truncate">
                {deptLabel} Department
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>
                  {typeLabel} · <span className="text-amber-600 font-medium">Department Chat</span>
                </span>
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

            <div className="flex items-center gap-2 shrink-0">
              {connected ? (
                <Wifi className="w-4 h-4 text-emerald-500" aria-label="Connected" />
              ) : (
                <WifiOff className="w-4 h-4 text-slate-300" aria-label="Disconnected" />
              )}
              <button
                onClick={() => setShowInfo((v) => !v)}
                className="text-slate-400 hover:text-[#043658] transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Access/join error */}
          {joinError && (
            <div className="flex items-center gap-2 bg-red-50 border-b border-red-200 px-4 py-2 text-xs text-red-700 shrink-0">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {joinError}
            </div>
          )}

          {/* Department banner */}
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 shrink-0">
            <p className="text-xs text-amber-700">
              <span className="font-semibold">🎯 {deptLabel} Department</span>
              {' '}— only {deptLabel} teachers at the{' '}
              <span className="font-medium">{typeLabel}</span> level can access this chat.
            </p>
          </div>

          {/* Messages */}
          <div
            ref={messagesEl}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/40"
          >
            {loadingMore && (
              <div className="flex justify-center py-2">
                <Loader className="w-4 h-4 animate-spin text-slate-300" />
              </div>
            )}

            {loadingMsgs ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader className="w-6 h-6 animate-spin text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Loading messages…</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                <div className="text-3xl mb-1">💬</div>
                <p className="text-sm font-medium text-slate-700">No messages yet</p>
                <p className="text-xs text-slate-400 max-w-xs">
                  Be the first to start a conversation in the {deptLabel} department chat!
                </p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={msg.id}>
                  {needsDateSep(messages[i - 1], msg) && (
                    <div className="flex items-center gap-3 py-2">
                      <div className="flex-1 h-px bg-slate-200" />
                      <span className="text-[10px] text-slate-400 font-medium px-2">
                        {fmtDateLabel(msg.createdAt)}
                      </span>
                      <div className="flex-1 h-px bg-slate-200" />
                    </div>
                  )}
                  <Bubble msg={msg} isOwn={msg.senderId === user?.id} />
                </div>
              ))
            )}

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 pl-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
                <span className="text-xs text-slate-400">Someone is typing…</span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-slate-100 bg-white shrink-0">
            {!connected && (
              <p className="text-xs text-amber-600 text-center mb-1.5 flex items-center justify-center gap-1">
                <WifiOff className="w-3 h-3" />
                Reconnecting to chat…
              </p>
            )}
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                rows={1}
                onChange={handleInputChange}
                onKeyDown={handleKey}
                disabled={!connected}
                placeholder={
                  connected
                    ? `Message ${deptLabel} department… (Enter to send)`
                    : 'Connecting…'
                }
                className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#043658]/30 focus:border-[#043658] transition disabled:opacity-50 max-h-32 overflow-y-auto"
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

        {/* ── Right info panel ─────────────────────────────────────────────── */}
        {showInfo && (
          <aside className="w-72 shrink-0 border-l border-slate-100 bg-white overflow-y-auto hidden lg:flex flex-col">
            {/* Panel header */}
            <div className="p-5 border-b border-slate-100">
              <div className="w-16 h-16 rounded-full bg-amber-500 text-white font-bold text-xl flex items-center justify-center mx-auto mb-3">
                {deptLabel.slice(0, 2).toUpperCase()}
              </div>
              <h2 className="text-sm font-bold text-slate-900 text-center">
                {deptLabel} Department
              </h2>
              <p className="text-xs text-slate-500 text-center mt-0.5">
                {typeLabel} Level · Department Chat
              </p>
              {onlineCount !== null && (
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-600 justify-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {onlineCount} member{onlineCount !== 1 ? 's' : ''} online
                </div>
              )}
            </div>

            {/* Details */}
            <div className="p-5 space-y-4 text-xs text-slate-600 flex-1">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                  Scope
                </p>
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <span className="text-slate-400 w-20 shrink-0">Department</span>
                    <span className="font-medium text-amber-700">{deptLabel}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-400 w-20 shrink-0">Level</span>
                    <span>{typeLabel}</span>
                  </div>
                  {group?.woreda && (
                    <div className="flex gap-2">
                      <span className="text-slate-400 w-20 shrink-0">Woreda</span>
                      <span>{group.woreda}</span>
                    </div>
                  )}
                  {group?.zone && (
                    <div className="flex gap-2">
                      <span className="text-slate-400 w-20 shrink-0">Zone</span>
                      <span>{group.zone}</span>
                    </div>
                  )}
                  {group?.region && (
                    <div className="flex gap-2">
                      <span className="text-slate-400 w-20 shrink-0">Region</span>
                      <span>{group.region}</span>
                    </div>
                  )}
                  {group?.school && (
                    <div className="flex gap-2">
                      <span className="text-slate-400 w-20 shrink-0">School</span>
                      <span>{group.school}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                  About
                </p>
                <p className="leading-relaxed text-slate-500">
                  A collaborative space for {deptLabel} teachers at the {typeLabel} level.
                  Share lesson plans, resources, and professional insights.
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                  Stats
                </p>
                <p>{messages.length} messages loaded</p>
                {total > messages.length && (
                  <button
                    onClick={loadOlder}
                    className="mt-1 text-[#043658] hover:underline"
                  >
                    Load {total - messages.length} older messages
                  </button>
                )}
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                  Navigation
                </p>
                <Link
                  href={`/community/type/${type}/chat`}
                  className="block text-[#043658] hover:underline mb-1"
                >
                  ← {typeLabel} Common Chat
                </Link>
                <Link
                  href={`/community/type/${type}`}
                  className="block text-[#043658] hover:underline mb-1"
                >
                  ← {typeLabel} Community Feed
                </Link>
                <Link
                  href="/community/chat"
                  className="block text-[#043658] hover:underline"
                >
                  All Chat Groups
                </Link>
              </div>
            </div>
          </aside>
        )}
      </main>
    </div>
  );
}
