import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createDirectConversation,
  getDirectConversations,
  getDirectConversationMessages,
  sendDirectMessage,
  type DirectConversation,
  type DirectMessage,
} from '@/services/direct-messages';

export function useCreateDirectConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (targetTeacherId: string) => createDirectConversation(targetTeacherId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['direct-conversations'] });
    },
  });
}

export function useDirectConversations() {
  return useQuery({
    queryKey: ['direct-conversations'],
    queryFn: getDirectConversations,
  });
}

export const useDirectConversationMessages = (
  chatRoomId: string,
  cursor?: string,
  limit?: number,
) => {
  return useQuery({
    queryKey: ['directConversationMessages', chatRoomId, cursor, limit],
    queryFn: () => getDirectConversationMessages(chatRoomId, cursor, limit),
    enabled: !!chatRoomId,
  });
};

export const useDirectConversationParticipant = (chatRoomId: string) => {
  return useQuery({
    queryKey: ['directConversationParticipant', chatRoomId],
    queryFn: () => getDirectConversationMessages(chatRoomId, undefined, 1),
    enabled: !!chatRoomId,
    select: (data) => data.otherParticipant,
  });
};

export function useSendDirectMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatRoomId, content, replyToId, attachmentUrls }: {
      chatRoomId: string;
      content: string;
      replyToId?: string;
      attachmentUrls?: string[];
    }) => sendDirectMessage(chatRoomId, content, replyToId, attachmentUrls),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['directConversationMessages', variables.chatRoomId] });
      queryClient.invalidateQueries({ queryKey: ['direct-conversations'] });
    },
  });
}
