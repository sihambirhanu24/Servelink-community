import { io, Socket } from 'socket.io-client';
import { DiscussionMessage } from '@/types/discussion';

type Listener = (...args: any[]) => void;

export interface DiscussionJoinedPayload {
  discussionPostId: string;
  messages: DiscussionMessage[];
  hasMore: boolean;
  onlineCount: number;
}

export interface TypingIndicator {
  teacherId: string;
  senderName: string;
}

class DiscussionSocketClient {
  private socket: Socket | null = null;
  private listeners = new Map<string, Set<Listener>>();
  private isConnecting = false;

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }
      if (this.isConnecting) {
        // Already connecting, just resolve - it will connect eventually
        resolve();
        return;
      }

      this.isConnecting = true;
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';

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

      this.socket.on('disconnect', () => {
        this.emit('disconnected', undefined);
      });

      this.socket.on('reconnect', () => {
        this.emit('reconnected', undefined);
      });

      // Forward all discussion-related server events
      const forward = (event: string) =>
        this.socket!.on(event, (data: any) => this.emit(event, data));

      [
        'discussion:joined',
        'discussion:presence',
        'discussion:message:new',
        'discussion:message:updated',
        'discussion:message:deleted',
        'discussion:message:reaction',
        'discussion:typing:started',
        'discussion:typing:stopped',
        'error',
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

  joinDiscussion(discussionPostId: string): void {
    this.socket?.emit('discussion:join', { discussionPostId });
  }

  leaveDiscussion(discussionPostId: string): void {
    this.socket?.emit('discussion:leave', { discussionPostId });
  }

  sendMessage(discussionPostId: string, content: string, replyToId?: string): void {
    this.socket?.emit('discussion:message:send', { discussionPostId, content, replyToId });
  }

  editMessage(messageId: string, discussionPostId: string, content: string): void {
    this.socket?.emit('discussion:message:edit', { messageId, discussionPostId, content });
  }

  deleteMessage(messageId: string, discussionPostId: string): void {
    this.socket?.emit('discussion:message:delete', { messageId, discussionPostId });
  }

  toggleHelpful(messageId: string, discussionPostId: string): void {
    this.socket?.emit('discussion:message:helpful', { messageId, discussionPostId });
  }

  typingStart(discussionPostId: string, senderName: string): void {
    this.socket?.emit('discussion:typing:start', { discussionPostId, senderName });
  }

  typingStop(discussionPostId: string): void {
    this.socket?.emit('discussion:typing:stop', { discussionPostId });
  }

  // ── Listener management ─────────────────────────────────────────────────

  on(event: string, cb: Listener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(cb);
  }

  off(event: string, cb: Listener): void {
    this.listeners.get(event)?.delete(cb);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach((cb) => {
      try {
        cb(data);
      } catch (e) {
        console.error(`discussion socket listener error [${event}]:`, e);
      }
    });
  }
}

export const discussionSocket = new DiscussionSocketClient();
