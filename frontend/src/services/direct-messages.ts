import api from '@/lib/axios';

export interface DirectConversation {
  id: string;
  otherParticipant: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage: string | null;
    level: string;
    verified: boolean;
  };
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

export interface DirectMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderName: string;
  senderProfileImage: string | null;
  senderLevel: string;
  content: string;
  replyToId?: string;
  editedAt?: string;
  deletedAt?: string;
  attachments: any[];
  reactions: Record<string, number>;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DirectConversationParticipant {
  id: string;
  firstName: string;
  lastName: string;
  profileImage: string | null;
  level: string;
  verified: boolean;
  profession: string | null;
  department: string | null;
  school: string | null;
}

export const createDirectConversation = async (targetTeacherId: string) => {
  const { data } = await api.post('/direct-messages/conversations', { targetTeacherId });
  return data;
};

export const getDirectConversations = async () => {
  const { data } = await api.get('/direct-messages/conversations');
  return data.conversations as DirectConversation[];
};

export const getDirectConversationMessages = async (
  chatRoomId: string,
  cursor?: string,
  limit?: number,
) => {
  const { data } = await api.get(`/direct-messages/conversations/${chatRoomId}/messages`, {
    params: { cursor, limit },
  });
  return data;
};

export const sendDirectMessage = async (
  chatRoomId: string,
  content: string,
  replyToId?: string,
  attachmentUrls?: string[],
) => {
  const { data } = await api.post(`/direct-messages/conversations/${chatRoomId}/messages`, {
    content,
    replyToId,
    attachmentUrls,
  });
  return data;
};

export const uploadDirectMessageAttachment = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post('/direct-messages/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};
