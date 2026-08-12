import { io, Socket } from 'socket.io-client';
import api from '@/lib/axios';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderName: string;
  senderProfileImage?: string | null;
  senderLevel: string;
  content: string;
  replyToId?: string;
  editedAt?: string;
  deletedAt?: string;
  attachments?: any[];
  reactions?: Record<string, number>;
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatGroup {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  school?: string | null;
  woreda?: string | null;
  zone?: string | null;
  region?: string | null;
  chatRoomId?: string | null;
  unreadCount: number;
  lastMessage?: {
    content: string;
    senderName: string;
    createdAt: string;
  } | null;
}

export interface CommunityJoinedPayload {
  communityId: string;
  chatRoomId: string;
  messages: ChatMessage[];
  onlineCount: number;
}

export interface MessageHistoryResponse {
  messages: ChatMessage[];
  total: number;
  page: number;
  limit: number;
}

export interface ChatCommunityInfo {
  community: {
    id: string;
    name: string;
    type: string;
    description?: string | null;
    school?: string | null;
    woreda?: string | null;
    zone?: string | null;
    region?: string | null;
  };
  chatRoomId: string;
}

// ─── REST helpers ─────────────────────────────────────────────────────────────

/**
 * GET /api/chat/groups
 * Returns chat groups the authenticated teacher can access.
 * Access is computed server-side from teacher.level + geography.
 */
export async function fetchAccessibleChatGroups(): Promise<ChatGroup[]> {
  const { data } = await api.get('/chat/groups');
  // Response shape: { groups: ChatGroup[] }
  return Array.isArray(data) ? data : (data.groups ?? []);
}

/**
 * GET /api/community/:communityId/chat/messages?page=1&limit=50
 */
export async function fetchChatMessages(
  communityId: string,
  page = 1,
  limit = 50,
): Promise<MessageHistoryResponse> {
  const { data } = await api.get(
    `/community/${communityId}/chat/messages?page=${page}&limit=${limit}`,
  );
  return data;
}

/**
 * GET /api/community/:communityId/chat/info
 */
export async function fetchChatInfo(communityId: string): Promise<ChatCommunityInfo> {
  const { data } = await api.get(`/community/${communityId}/chat/info`);
  return data;
}

/**
 * POST /api/community/:communityId/chat/mark-read/bulk
 */
export async function markMessagesRead(
  communityId: string,
  messageIds: string[],
): Promise<void> {
  await api.post(`/community/${communityId}/chat/mark-read/bulk`, { messageIds });
}

// ─── Socket.IO client ─────────────────────────────────────────────────────────

type Listener = (...args: any[]) => void;

class ChatSocketClient {
  private socket: Socket | null = null;
  private listeners = new Map<string, Set<Listener>>();
  private isConnecting = false;

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) { resolve(); return; }
      if (this.isConnecting) { reject(new Error('Already connecting')); return; }

      this.isConnecting = true;
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';

      this.socket = io(`${backendUrl}/chat`, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
        transports: ['websocket', 'polling'],
      });

      this.socket.on('connect', () => {
        this.isConnecting = false;
        this.emit('connected', undefined);
        resolve();
      });

      this.socket.on('connect_error', (err) => {
        this.isConnecting = false;
        this.emit('connection_error', err);
        reject(err);
      });

      this.socket.on('disconnect', () => this.emit('disconnected', undefined));

      // Forward all server-pushed events to internal listener map
      const forward = (event: string) =>
        this.socket!.on(event, (data: any) => this.emit(event, data));

      [
        'community:joined',
        'message:new',
        'message:updated',
        'message:deleted',
        'message:reaction:added',
        'message:reaction:removed',
        'message:pinned',
        'message:unpinned',
        'presence:update',
        'unread-count:update',
        'typing:started',
        'typing:stopped',
        'error',
        'pong',
      ].forEach(forward);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.isConnecting = false;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // ── Emit helpers ────────────────────────────────────────────────────────

  joinCommunity(communityId: string): void {
    this.socket?.emit('community:join', { communityId });
  }

  leaveCommunity(communityId: string): void {
    this.socket?.emit('community:leave', { communityId });
  }

  sendMessage(communityId: string, content: string, replyToId?: string): void {
    this.socket?.emit('message:send', { communityId, content, replyToId });
  }

  editMessage(messageId: string, communityId: string, content: string): void {
    this.socket?.emit('message:edit', { messageId, communityId, content });
  }

  deleteMessage(messageId: string, communityId: string): void {
    this.socket?.emit('message:delete', { messageId, communityId });
  }

  addReaction(messageId: string, communityId: string, reaction: string): void {
    this.socket?.emit('message:reaction:add', { messageId, communityId, reaction });
  }

  markRead(communityId: string, messageIds: string[]): void {
    this.socket?.emit('message:mark-read', { communityId, messageIds });
  }

  typingStart(communityId: string): void {
    this.socket?.emit('typing:start', { communityId });
  }

  typingStop(communityId: string): void {
    this.socket?.emit('typing:stop', { communityId });
  }

  ping(): void {
    this.socket?.emit('ping');
  }

  // ── Listener management ─────────────────────────────────────────────────

  on(event: string, cb: Listener): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(cb);
  }

  off(event: string, cb: Listener): void {
    this.listeners.get(event)?.delete(cb);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach((cb) => {
      try { cb(data); } catch (e) { console.error(`chat socket listener error [${event}]:`, e); }
    });
  }
}

export const chatSocket = new ChatSocketClient();
