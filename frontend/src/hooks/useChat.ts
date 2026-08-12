import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { chatSocket, ChatMessage, fetchChatMessages } from '@/services/chat';

export interface UseChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  isReconnecting: boolean;
  currentCommunityId: string | null;
  currentChatRoomId: string | null;
  total: number;
}

export interface UseChatActions {
  sendMessage: (content: string) => Promise<void>;
  joinCommunity: (communityId: string) => Promise<void>;
  leaveCommunity: () => void;
  clearMessages: () => void;
}

/**
 * Hook for real-time chat with Socket.IO
 */
export function useChat(communityId?: string): UseChatState & UseChatActions {
  const { user, token } = useAuth();
  const [state, setState] = useState<UseChatState>({
    messages: [],
    isLoading: false,
    error: null,
    isConnected: false,
    isReconnecting: false,
    currentCommunityId: null,
    currentChatRoomId: null,
    total: 0,
  });

  const messageMapRef = useRef<Map<string, ChatMessage>>(new Map());
  const isJoiningRef = useRef(false);

  // Initialize socket connection
  useEffect(() => {
    if (!user || !token) return;

    const initSocket = async () => {
      try {
        await chatSocket.connect(token);
        setState((prev) => ({ ...prev, isConnected: true }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }));
      }
    };

    initSocket();

    // Set up event listeners
    const handleConnected = () => {
      setState((prev) => ({
        ...prev,
        isConnected: true,
        isReconnecting: false,
        error: null,
      }));
    };

    const handleDisconnected = () => {
      setState((prev) => ({ ...prev, isConnected: false }));
    };

    const handleReconnecting = (data: any) => {
      setState((prev) => ({
        ...prev,
        isReconnecting: true,
      }));
    };

    const handleReconnectFailed = () => {
      setState((prev) => ({
        ...prev,
        error: 'Failed to reconnect',
        isReconnecting: false,
      }));
    };

    const handleConnectionError = (error: any) => {
      setState((prev) => ({
        ...prev,
        error: `Connection error: ${error.message || 'Unknown error'}`,
      }));
    };

    const handleCommunityJoined = (payload: any) => {
      messageMapRef.current.clear();
      const messages = payload.messages || [];
      messages.forEach((msg: ChatMessage) => {
        messageMapRef.current.set(msg.id, msg);
      });

      setState((prev) => ({
        ...prev,
        messages,
        currentCommunityId: payload.communityId,
        currentChatRoomId: payload.chatRoomId,
        isLoading: false,
        error: null,
        total: messages.length,
      }));
    };

    const handleNewMessage = (message: ChatMessage) => {
      if (messageMapRef.current.has(message.id)) {
        return; // Deduplicate
      }

      messageMapRef.current.set(message.id, message);
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, message],
        total: prev.total + 1,
      }));
    };

    const handleError = (error: any) => {
      const errorMessage =
        error?.message || error?.code || 'An error occurred';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
    };

    chatSocket.on('connected', handleConnected);
    chatSocket.on('disconnected', handleDisconnected);
    chatSocket.on('reconnecting', handleReconnecting);
    chatSocket.on('reconnect_failed', handleReconnectFailed);
    chatSocket.on('connection_error', handleConnectionError);
    chatSocket.on('community:joined', handleCommunityJoined);
    chatSocket.on('message:new', handleNewMessage);
    chatSocket.on('error', handleError);

    return () => {
      chatSocket.off('connected', handleConnected);
      chatSocket.off('disconnected', handleDisconnected);
      chatSocket.off('reconnecting', handleReconnecting);
      chatSocket.off('reconnect_failed', handleReconnectFailed);
      chatSocket.off('connection_error', handleConnectionError);
      chatSocket.off('community:joined', handleCommunityJoined);
      chatSocket.off('message:new', handleNewMessage);
      chatSocket.off('error', handleError);
    };
  }, [user, token]);

  // Auto-join community if provided
  useEffect(() => {
    if (!communityId || !state.isConnected || state.currentCommunityId === communityId) {
      return;
    }

    const joinCommunityAsync = async () => {
      try {
        await joinCommunity(communityId);
      } catch (error) {
        // Error is already set in state
      }
    };

    joinCommunityAsync();
  }, [communityId, state.isConnected, state.currentCommunityId]);

  const joinCommunity = useCallback(
    async (id: string) => {
      if (isJoiningRef.current) return;
      if (!state.isConnected) {
        setState((prev) => ({
          ...prev,
          error: 'Socket not connected',
        }));
        return;
      }

      isJoiningRef.current = true;
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        await chatSocket.joinCommunity(id);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to join community',
          isLoading: false,
        }));
      } finally {
        isJoiningRef.current = false;
      }
    },
    [state.isConnected],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!state.isConnected) {
        setState((prev) => ({
          ...prev,
          error: 'Socket not connected',
        }));
        return;
      }

      if (!state.currentCommunityId) {
        setState((prev) => ({
          ...prev,
          error: 'Not in a community',
        }));
        return;
      }

      if (!content.trim()) {
        setState((prev) => ({
          ...prev,
          error: 'Message cannot be empty',
        }));
        return;
      }

      try {
        chatSocket.sendMessage(state.currentCommunityId, content.trim());
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to send message',
        }));
      }
    },
    [state.isConnected, state.currentCommunityId],
  );

  const leaveCommunity = useCallback(() => {
    messageMapRef.current.clear();
    setState((prev) => ({
      ...prev,
      messages: [],
      currentCommunityId: null,
      currentChatRoomId: null,
      error: null,
      total: 0,
    }));
  }, []);

  const clearMessages = useCallback(() => {
    messageMapRef.current.clear();
    setState((prev) => ({
      ...prev,
      messages: [],
      total: 0,
    }));
  }, []);

  return {
    ...state,
    sendMessage,
    joinCommunity,
    leaveCommunity,
    clearMessages,
  };
}
