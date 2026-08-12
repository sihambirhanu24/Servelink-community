export class ChatMessageResponseDto {
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
