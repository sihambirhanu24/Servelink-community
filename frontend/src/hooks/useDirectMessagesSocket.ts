import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { DirectMessage } from '@/services/direct-messages';

export function useDirectMessagesSocket(chatRoomId: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [newMessage, setNewMessage] = useState<DirectMessage | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!chatRoomId) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('direct:join', { chatRoomId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('direct:joined', (data) => {
      setOtherUserOnline(data.onlineCount > 1);
    });

    socket.on('direct:presence', (data) => {
      setOtherUserOnline(data.onlineCount > 1);
    });

    socket.on('direct:message:new', (message: DirectMessage) => {
      setNewMessage(message);
    });

    socket.on('direct:typing:started', () => {
      // Handle typing indicator
    });

    socket.on('direct:typing:stopped', () => {
      // Handle typing indicator
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      socket.emit('direct:leave', { chatRoomId });
      socket.disconnect();
    };
  }, [chatRoomId]);

  return { isConnected, otherUserOnline, newMessage };
}
