import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { discussionSocket, DiscussionJoinedPayload } from '@/services/discussionSocket';
import { DiscussionMessage } from '@/types/discussion';
import { discussionKeys } from './useDiscussions';

interface UseDiscussionSocketOptions {
  discussionId: string;
  onMessageReceived?: (message: DiscussionMessage) => void;
  onMessageUpdated?: (message: DiscussionMessage) => void;
  onMessageDeleted?: (messageId: string) => void;
}

export function useDiscussionSocket({
  discussionId,
  onMessageReceived,
  onMessageUpdated,
  onMessageDeleted,
}: UseDiscussionSocketOptions) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [messages, setMessages] = useState<DiscussionMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const typingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Connect to socket
  useEffect(() => {
    if (!token) return;

    let mounted = true;

    const connect = async () => {
      try {
        await discussionSocket.connect(token);
        if (mounted) {
          setIsConnected(true);
          setIsReconnecting(false);
        }
      } catch (err) {
        console.error('Failed to connect to discussion socket:', err);
        if (mounted) {
          setIsConnected(false);
        }
      }
    };

    connect();

    // Connection status listeners
    const handleConnected = () => {
      if (mounted) {
        setIsConnected(true);
        setIsReconnecting(false);
      }
    };

    const handleDisconnected = () => {
      if (mounted) {
        setIsConnected(false);
        setIsReconnecting(true);
      }
    };

    const handleReconnected = () => {
      if (mounted) {
        setIsConnected(true);
        setIsReconnecting(false);
        // Rejoin discussion after reconnect
        discussionSocket.joinDiscussion(discussionId);
      }
    };

    discussionSocket.on('connected', handleConnected);
    discussionSocket.on('disconnected', handleDisconnected);
    discussionSocket.on('reconnected', handleReconnected);

    return () => {
      mounted = false;
      discussionSocket.off('connected', handleConnected);
      discussionSocket.off('disconnected', handleDisconnected);
      discussionSocket.off('reconnected', handleReconnected);
    };
  }, [token, discussionId]);

  // Join discussion room
  useEffect(() => {
    if (!isConnected || !discussionId) return;

    discussionSocket.joinDiscussion(discussionId);

    return () => {
      discussionSocket.leaveDiscussion(discussionId);
    };
  }, [isConnected, discussionId]);

  // Handle discussion joined
  useEffect(() => {
    const handleJoined = (payload: DiscussionJoinedPayload) => {
      if (payload.discussionPostId === discussionId) {
        setMessages(payload.messages);
        setHasMore(payload.hasMore);
        setOnlineCount(payload.onlineCount);
      }
    };

    discussionSocket.on('discussion:joined', handleJoined);

    return () => {
      discussionSocket.off('discussion:joined', handleJoined);
    };
  }, [discussionId]);

  // Handle new message
  useEffect(() => {
    const handleNewMessage = (message: DiscussionMessage) => {
      setMessages((prev) => [...prev, message]);
      onMessageReceived?.(message);

      // Update discussion reply count in cache
      queryClient.setQueryData(discussionKeys.detail(discussionId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          replyCount: old.replyCount + 1,
          lastActiveAt: new Date().toISOString(),
        };
      });
    };

    discussionSocket.on('discussion:message:new', handleNewMessage);

    return () => {
      discussionSocket.off('discussion:message:new', handleNewMessage);
    };
  }, [discussionId, onMessageReceived, queryClient]);

  // Handle message updated
  useEffect(() => {
    const handleUpdated = (message: DiscussionMessage) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? message : m))
      );
      onMessageUpdated?.(message);
    };

    discussionSocket.on('discussion:message:updated', handleUpdated);

    return () => {
      discussionSocket.off('discussion:message:updated', handleUpdated);
    };
  }, [onMessageUpdated]);

  // Handle message deleted
  useEffect(() => {
    const handleDeleted = ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      onMessageDeleted?.(messageId);

      // Update discussion reply count in cache
      queryClient.setQueryData(discussionKeys.detail(discussionId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          replyCount: Math.max(0, old.replyCount - 1),
        };
      });
    };

    discussionSocket.on('discussion:message:deleted', handleDeleted);

    return () => {
      discussionSocket.off('discussion:message:deleted', handleDeleted);
    };
  }, [discussionId, onMessageDeleted, queryClient]);

  // Handle reaction update
  useEffect(() => {
    const handleReaction = (payload: {
      messageId: string;
      reaction: string;
      marked: boolean;
      count: number;
      teacherId: string;
    }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== payload.messageId) return m;

          const reactions = Array.isArray(m.reactions) ? m.reactions : [];
          const updatedReactions = reactions.filter(
            (r) => r.reaction !== payload.reaction
          );

          if (payload.count > 0) {
            updatedReactions.push({
              id: `${payload.messageId}-${payload.reaction}`,
              reaction: payload.reaction,
              teacherId: payload.teacherId,
            });
          }

          return { ...m, reactions: updatedReactions };
        })
      );
    };

    discussionSocket.on('discussion:message:reaction', handleReaction);

    return () => {
      discussionSocket.off('discussion:message:reaction', handleReaction);
    };
  }, []);

  // Handle presence update
  useEffect(() => {
    const handlePresence = (payload: { discussionPostId: string; onlineCount: number }) => {
      if (payload.discussionPostId === discussionId) {
        setOnlineCount(payload.onlineCount);
      }
    };

    discussionSocket.on('discussion:presence', handlePresence);

    return () => {
      discussionSocket.off('discussion:presence', handlePresence);
    };
  }, [discussionId]);

  // Handle typing indicators
  useEffect(() => {
    const handleTypingStart = ({ teacherId, senderName }: { teacherId: string; senderName: string }) => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.set(teacherId, senderName);
        return next;
      });

      // Clear existing timeout
      const existingTimeout = typingTimeouts.current.get(teacherId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Auto-remove after 3 seconds
      const timeout = setTimeout(() => {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.delete(teacherId);
          return next;
        });
        typingTimeouts.current.delete(teacherId);
      }, 3000);

      typingTimeouts.current.set(teacherId, timeout);
    };

    const handleTypingStop = ({ teacherId }: { teacherId: string }) => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.delete(teacherId);
        return next;
      });

      const timeout = typingTimeouts.current.get(teacherId);
      if (timeout) {
        clearTimeout(timeout);
        typingTimeouts.current.delete(teacherId);
      }
    };

    discussionSocket.on('discussion:typing:started', handleTypingStart);
    discussionSocket.on('discussion:typing:stopped', handleTypingStop);

    return () => {
      discussionSocket.off('discussion:typing:started', handleTypingStart);
      discussionSocket.off('discussion:typing:stopped', handleTypingStop);
      
      // Clear all timeouts
      typingTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      typingTimeouts.current.clear();
    };
  }, []);

  // Send message
  const sendMessage = useCallback(
    (content: string, replyToId?: string) => {
      discussionSocket.sendMessage(discussionId, content, replyToId);
    },
    [discussionId]
  );

  // Edit message
  const editMessage = useCallback(
    (messageId: string, content: string) => {
      discussionSocket.editMessage(messageId, discussionId, content);
    },
    [discussionId]
  );

  // Delete message
  const deleteMessage = useCallback(
    (messageId: string) => {
      discussionSocket.deleteMessage(messageId, discussionId);
    },
    [discussionId]
  );

  // Toggle helpful
  const toggleHelpful = useCallback(
    (messageId: string) => {
      discussionSocket.toggleHelpful(messageId, discussionId);
    },
    [discussionId]
  );

  // Typing indicators
  const startTyping = useCallback(
    (senderName: string) => {
      discussionSocket.typingStart(discussionId, senderName);
    },
    [discussionId]
  );

  const stopTyping = useCallback(() => {
    discussionSocket.typingStop(discussionId);
  }, [discussionId]);

  return {
    isConnected,
    isReconnecting,
    messages,
    hasMore,
    onlineCount,
    typingUsers: Array.from(typingUsers.values()),
    sendMessage,
    editMessage,
    deleteMessage,
    toggleHelpful,
    startTyping,
    stopTyping,
  };
}
