'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import io, { Socket } from 'socket.io-client';

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderName: string;
  senderProfileImage?: string | null;
  senderLevel: string;
  content: string;
  replyToId?: string;
  editedAt?: Date;
  deletedAt?: Date;
  attachments?: any[];
  reactions?: Record<string, number>;
  readCount?: number;
  isPinned?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatState {
  messages: ChatMessage[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  typingUsers: string[];
  unreadCount: number;
}

export function useChatSocket(communityId?: string) {
  const { token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const messageMapRef = useRef<Map<string, ChatMessage>>(new Map());

  const [state, setState] = useState<ChatState>({
    messages: [],
    isConnected: false,
    isLoading: false,
    error: null,
    typingUsers: [],
    unreadCount: 0,
  });

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!token || !communityId) return;

    setState((prev) => ({ ...prev, isLoading: true }));

    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const socket = io(`${backendUrl}/chat`, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setState((prev) => ({ ...prev, isConnected: true, error: null }));
      socket.emit('community:join', { communityId });
    });

    socket.on('community:joined', (payload) => {
      messageMapRef.current.clear();
      const messages = payload.messages || [];
      messages.forEach((msg: ChatMessage) => {
        messageMapRef.current.set(msg.id, msg);
      });
      setState((prev) => ({
        ...prev,
        messages,
        isLoading: false,
      }));
    });

    socket.on('message:new', (message: ChatMessage) => {
      if (!messageMapRef.current.has(message.id)) {
        messageMapRef.current.set(message.id, message);
        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, message],
        }));
      }
    });

    socket.on('message:updated', (message: ChatMessage) => {
      messageMapRef.current.set(message.id, message);
      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((m) => (m.id === message.id ? message : m)),
      }));
    });

    socket.on('message:deleted', (data: { messageId: string }) => {
      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === data.messageId ? { ...m, deletedAt: new Date() } : m,
        ),
      }));
    });

    socket.on('message:reaction:added', (data) => {
      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((m) => {
          if (m.id === data.messageId) {
            return {
              ...m,
              reactions: {
                ...(m.reactions || {}),
                [data.reaction]: (m.reactions?.[data.reaction] || 0) + 1,
              },
            };
          }
          return m;
        }),
      }));
    });

    socket.on('message:reaction:removed', (data) => {
      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((m) => {
          if (m.id === data.messageId) {
            const reactions = { ...(m.reactions || {}) };
            if (reactions[data.reaction]) {
              reactions[data.reaction]--;
              if (reactions[data.reaction] === 0) {
                delete reactions[data.reaction];
              }
            }
            return { ...m, reactions };
          }
          return m;
        }),
      }));
    });

    socket.on('message:pinned', (data: { messageId: string }) => {
      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === data.messageId ? { ...m, isPinned: true } : m,
        ),
      }));
    });

    socket.on('message:unpinned', (data: { messageId: string }) => {
      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === data.messageId ? { ...m, isPinned: false } : m,
        ),
      }));
    });

    socket.on('typing:started', (data) => {
      setState((prev) => ({
        ...prev,
        typingUsers: [...new Set([...prev.typingUsers, data.userId])],
      }));
    });

    socket.on('typing:stopped', (data) => {
      setState((prev) => ({
        ...prev,
        typingUsers: prev.typingUsers.filter((u) => u !== data.userId),
      }));
    });

    socket.on('unread-count:update', (data) => {
      setState((prev) => ({
        ...prev,
        unreadCount: data.count,
      }));
    });

    socket.on('disconnect', () => {
      setState((prev) => ({ ...prev, isConnected: false }));
    });

    socket.on('error', (error) => {
      setState((prev) => ({
        ...prev,
        error: error.message || 'Connection error',
        isLoading: false,
      }));
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [token, communityId]);

  // Send message
  const sendMessage = useCallback(
    (content: string, replyToId?: string, attachmentUrls?: string[]) => {
      if (!socketRef.current?.connected) return;
      socketRef.current.emit('message:send', {
        communityId,
        content,
        replyToId,
        attachmentUrls,
      });
    },
    [communityId],
  );

  // Edit message
  const editMessage = useCallback(
    (messageId: string, content: string) => {
      if (!socketRef.current?.connected) return;
      socketRef.current.emit('message:edit', {
        messageId,
        communityId,
        content,
      });
    },
    [communityId],
  );

  // Delete message
  const deleteMessage = useCallback(
    (messageId: string) => {
      if (!socketRef.current?.connected) return;
      socketRef.current.emit('message:delete', {
        messageId,
        communityId,
      });
    },
    [communityId],
  );

  // Add reaction
  const addReaction = useCallback(
    (messageId: string, reaction: string) => {
      if (!socketRef.current?.connected) return;
      socketRef.current.emit('message:reaction:add', {
        messageId,
        communityId,
        reaction,
      });
    },
    [communityId],
  );

  // Remove reaction
  const removeReaction = useCallback(
    (messageId: string, reaction: string) => {
      if (!socketRef.current?.connected) return;
      socketRef.current.emit('message:reaction:remove', {
        messageId,
        communityId,
        reaction,
      });
    },
    [communityId],
  );

  // Mark messages as read
  const markMessagesAsRead = useCallback(
    (messageIds: string[]) => {
      if (!socketRef.current?.connected) return;
      socketRef.current.emit('message:mark-read', {
        messageIds,
        communityId,
      });
    },
    [communityId],
  );

  // Pin message
  const pinMessage = useCallback(
    (messageId: string) => {
      if (!socketRef.current?.connected) return;
      socketRef.current.emit('message:pin', {
        messageId,
        communityId,
      });
    },
    [communityId],
  );

  // Unpin message
  const unpinMessage = useCallback(
    (messageId: string) => {
      if (!socketRef.current?.connected) return;
      socketRef.current.emit('message:unpin', {
        messageId,
        communityId,
      });
    },
    [communityId],
  );

  // Start typing
  const startTyping = useCallback(() => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('typing:start', { communityId });
  }, [communityId]);

  // Stop typing
  const stopTyping = useCallback(() => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('typing:stop', { communityId });
  }, [communityId]);

  return {
    ...state,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    markMessagesAsRead,
    pinMessage,
    unpinMessage,
    startTyping,
    stopTyping,
  };
}
