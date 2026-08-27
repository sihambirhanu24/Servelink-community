import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('ChatGateway');

  /**
   * socketId → teacherId
   */
  private socketTeacher = new Map<string, string>();

  /**
   * teacherId → Set<socketId>  (one teacher may have multiple tabs)
   */
  private teacherSockets = new Map<string, Set<string>>();

  /**
   * socketId → communityId  (the room this socket is currently in)
   */
  private socketRoom = new Map<string, string>();

  /**
   * communityId → Set<teacherId>  (online presence per room)
   */
  private roomPresence = new Map<string, Set<string>>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // LIFECYCLE
  // ─────────────────────────────────────────────────────────────────────────

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.emit('error', { code: 'UNAUTHORIZED', message: 'No token provided' });
        client.disconnect();
        return;
      }

      const secret =
        this.configService.get<string>('jwtSecret') ||
        this.configService.get<string>('JWT_SECRET') ||
        'secret';

      const payload = this.jwtService.verify(token, { secret });
      const teacherId: string = payload.sub;

      client.data.teacherId = teacherId;
      this.socketTeacher.set(client.id, teacherId);

      if (!this.teacherSockets.has(teacherId)) {
        this.teacherSockets.set(teacherId, new Set());
      }
      this.teacherSockets.get(teacherId)!.add(client.id);

      this.logger.debug(`Connected: teacher=${teacherId} socket=${client.id}`);
    } catch (err) {
      this.logger.warn(`Connection rejected: ${err.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const teacherId = this.socketTeacher.get(client.id);
    const communityId = this.socketRoom.get(client.id);

    // Remove from socket maps
    this.socketTeacher.delete(client.id);
    this.socketRoom.delete(client.id);

    if (teacherId) {
      const sockets = this.teacherSockets.get(teacherId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) this.teacherSockets.delete(teacherId);
      }

      // If no remaining sockets for this teacher, remove from presence
      if (!this.teacherSockets.has(teacherId) && communityId) {
        this.removePresence(communityId, teacherId);
        this.broadcastPresence(communityId);
      }
    }

    this.logger.debug(`Disconnected: socket=${client.id}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRESENCE HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  private addPresence(communityId: string, teacherId: string) {
    if (!this.roomPresence.has(communityId)) {
      this.roomPresence.set(communityId, new Set());
    }
    this.roomPresence.get(communityId)!.add(teacherId);
  }

  private removePresence(communityId: string, teacherId: string) {
    const room = this.roomPresence.get(communityId);
    if (room) {
      room.delete(teacherId);
      if (room.size === 0) this.roomPresence.delete(communityId);
    }
  }

  private broadcastPresence(communityId: string) {
    const count = this.roomPresence.get(communityId)?.size ?? 0;
    this.server.to(`community:${communityId}`).emit('presence:update', {
      communityId,
      onlineCount: count,
    });
  }

  /** How many distinct teachers are online in a room */
  getOnlineCount(communityId: string): number {
    return this.roomPresence.get(communityId)?.size ?? 0;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // JOIN / LEAVE
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Event: community:join  { communityId: string }
   *
   * Backend verifies level + geographic access before joining room.
   * On success emits community:joined with recent messages.
   */
  @SubscribeMessage('community:join')
  async handleJoinCommunity(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { communityId: string },
  ) {
    const teacherId = client.data.teacherId;
    if (!teacherId) {
      client.emit('error', { code: 'UNAUTHORIZED', message: 'Not authenticated' });
      return;
    }

    const { communityId } = data ?? {};
    if (!communityId) {
      client.emit('error', { code: 'BAD_REQUEST', message: 'communityId required' });
      return;
    }

    try {
      // ① Verify the teacher actually has access to this community
      await this.chatService.verifyAndGetCommunity(communityId, teacherId);

      // ② Leave any previously joined room for this socket
      const prevCommunity = this.socketRoom.get(client.id);
      if (prevCommunity && prevCommunity !== communityId) {
        client.leave(`community:${prevCommunity}`);
        this.socketRoom.delete(client.id);
        // Remove presence only if no other sockets from same teacher in that room
        const otherSocketsInPrev = [...(this.teacherSockets.get(teacherId) ?? [])].filter(
          (sid) => sid !== client.id && this.socketRoom.get(sid) === prevCommunity,
        );
        if (otherSocketsInPrev.length === 0) {
          this.removePresence(prevCommunity, teacherId);
          this.broadcastPresence(prevCommunity);
        }
      }

      // ③ Ensure chat room exists and get/load messages
      const chatRoom = await this.chatService.getOrCreateChatRoom(communityId);
      const messages = await this.chatService.getRecentMessages(chatRoom.id, 50);

      // ④ Join room, update maps
      client.join(`community:${communityId}`);
      this.socketRoom.set(client.id, communityId);
      this.addPresence(communityId, teacherId);

      // ⑤ Acknowledge to the joining client
      client.emit('community:joined', {
        communityId,
        chatRoomId: chatRoom.id,
        messages,
        onlineCount: this.getOnlineCount(communityId),
      });

      // ⑥ Broadcast updated presence to the whole room
      this.broadcastPresence(communityId);

      this.logger.debug(`Teacher ${teacherId} joined community:${communityId}`);
    } catch (err) {
      this.logger.warn(`Join failed teacher=${teacherId} community=${communityId}: ${err.message}`);
      client.emit('error', { code: err.status === 403 ? 'FORBIDDEN' : 'ERROR', message: err.message });
    }
  }

  /**
   * Event: community:leave  { communityId: string }
   */
  @SubscribeMessage('community:leave')
  async handleLeaveCommunity(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { communityId: string },
  ) {
    const teacherId = client.data.teacherId;
    const { communityId } = data ?? {};
    if (!communityId) return;

    client.leave(`community:${communityId}`);
    this.socketRoom.delete(client.id);

    if (teacherId) {
      const otherSocketsInRoom = [...(this.teacherSockets.get(teacherId) ?? [])].filter(
        (sid) => sid !== client.id && this.socketRoom.get(sid) === communityId,
      );
      if (otherSocketsInRoom.length === 0) {
        this.removePresence(communityId, teacherId);
        this.broadcastPresence(communityId);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MESSAGES
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Event: message:send  { communityId, content, replyToId?, attachmentUrls? }
   *
   * Flow:
   *  1. Verify teacher access (level + geography)
   *  2. Save to PostgreSQL
   *  3. Broadcast saved message to the entire room (including sender)
   */
  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      communityId: string;
      content: string;
      replyToId?: string;
      attachmentUrls?: string[];
    },
  ) {
    const teacherId = client.data.teacherId;
    if (!teacherId) {
      client.emit('error', { code: 'UNAUTHORIZED', message: 'Not authenticated' });
      return;
    }

    const { communityId, content, replyToId, attachmentUrls } = data ?? {};

    if (!communityId || !content?.trim()) {
      client.emit('error', { code: 'BAD_REQUEST', message: 'communityId and content are required' });
      return;
    }

    try {
      // ① Authorization check (throws if not allowed)
      await this.chatService.verifyAndGetCommunity(communityId, teacherId);

      // ② Ensure the socket is actually in this room (they must have joined first)
      const currentRoom = this.socketRoom.get(client.id);
      if (currentRoom !== communityId) {
        client.emit('error', { code: 'FORBIDDEN', message: 'You must join the community room first' });
        return;
      }

      // ③ Get chat room
      const chatRoom = await this.chatService.getOrCreateChatRoom(communityId);

      // ④ Persist to PostgreSQL FIRST, then broadcast
      const dto: SendMessageDto = { content: content.trim(), replyToId, attachmentUrls };
      const message = await this.chatService.saveMessageWithAttachments(
        chatRoom.id,
        teacherId,
        dto,
        attachmentUrls ?? [],
      );

      // ⑤ Broadcast the saved, persisted message to all room members
      this.server.to(`community:${communityId}`).emit('message:new', message);

      this.logger.debug(
        `Message saved & broadcast: teacher=${teacherId} community=${communityId}`,
      );
    } catch (err) {
      this.logger.error(`message:send error: ${err.message}`);
      client.emit('error', { code: err.status === 403 ? 'FORBIDDEN' : 'ERROR', message: err.message });
    }
  }

  /** Event: message:edit  { messageId, communityId, content } */
  @SubscribeMessage('message:edit')
  async handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; communityId: string; content: string },
  ) {
    const teacherId = client.data.teacherId;
    if (!teacherId) return;
    try {
      const updated = await this.chatService.editMessage(
        data.messageId, data.communityId, teacherId, { content: data.content },
      );
      this.server.to(`community:${data.communityId}`).emit('message:updated', updated);
    } catch (err) {
      client.emit('error', { code: 'ERROR', message: err.message });
    }
  }

  /** Event: message:delete  { messageId, communityId } */
  @SubscribeMessage('message:delete')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; communityId: string },
  ) {
    const teacherId = client.data.teacherId;
    if (!teacherId) return;
    try {
      await this.chatService.deleteMessage(data.messageId, data.communityId, teacherId);
      this.server.to(`community:${data.communityId}`).emit('message:deleted', { messageId: data.messageId });
    } catch (err) {
      client.emit('error', { code: 'ERROR', message: err.message });
    }
  }

  /** Event: message:reaction:add  { messageId, communityId, reaction } */
  @SubscribeMessage('message:reaction:add')
  async handleAddReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; communityId: string; reaction: string },
  ) {
    const teacherId = client.data.teacherId;
    if (!teacherId) return;
    try {
      await this.chatService.addReaction(data.messageId, data.communityId, teacherId, { reaction: data.reaction });
      this.server.to(`community:${data.communityId}`).emit('message:reaction:added', {
        messageId: data.messageId,
        reaction: data.reaction,
        teacherId,
      });
    } catch (err) {
      client.emit('error', { code: 'ERROR', message: err.message });
    }
  }

  /** Event: message:reaction:remove  { messageId, communityId, reaction } */
  @SubscribeMessage('message:reaction:remove')
  async handleRemoveReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; communityId: string; reaction: string },
  ) {
    const teacherId = client.data.teacherId;
    if (!teacherId) return;
    try {
      await this.chatService.removeReaction(data.messageId, data.communityId, teacherId, data.reaction);
      this.server.to(`community:${data.communityId}`).emit('message:reaction:removed', {
        messageId: data.messageId,
        reaction: data.reaction,
        teacherId,
      });
    } catch (err) {
      client.emit('error', { code: 'ERROR', message: err.message });
    }
  }

  /** Event: message:mark-read  { messageIds, communityId } */
  @SubscribeMessage('message:mark-read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageIds: string[]; communityId: string },
  ) {
    const teacherId = client.data.teacherId;
    if (!teacherId) return;
    try {
      await this.chatService.markMessagesAsRead(data.messageIds, data.communityId, teacherId);
      const count = await this.chatService.getUnreadCount(data.communityId, teacherId);
      client.emit('unread-count:update', { communityId: data.communityId, count });
    } catch (err) {
      client.emit('error', { code: 'ERROR', message: err.message });
    }
  }

  /** Event: message:pin  { messageId, communityId } */
  @SubscribeMessage('message:pin')
  async handlePinMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; communityId: string },
  ) {
    const teacherId = client.data.teacherId;
    if (!teacherId) return;
    try {
      await this.chatService.pinMessage(data.messageId, data.communityId, teacherId);
      this.server.to(`community:${data.communityId}`).emit('message:pinned', { messageId: data.messageId });
    } catch (err) {
      client.emit('error', { code: 'ERROR', message: err.message });
    }
  }

  /** Event: message:unpin  { messageId, communityId } */
  @SubscribeMessage('message:unpin')
  async handleUnpinMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; communityId: string },
  ) {
    const teacherId = client.data.teacherId;
    if (!teacherId) return;
    try {
      await this.chatService.unpinMessage(data.messageId, data.communityId, teacherId);
      this.server.to(`community:${data.communityId}`).emit('message:unpinned', { messageId: data.messageId });
    } catch (err) {
      client.emit('error', { code: 'ERROR', message: err.message });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TYPING & PING
  // ─────────────────────────────────────────────────────────────────────────

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { communityId: string },
  ) {
    const teacherId = client.data.teacherId;
    if (!teacherId || !data?.communityId) return;
    client.to(`community:${data.communityId}`).emit('typing:started', { teacherId });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { communityId: string },
  ) {
    const teacherId = client.data.teacherId;
    if (!teacherId || !data?.communityId) return;
    client.to(`community:${data.communityId}`).emit('typing:stopped', { teacherId });
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { time: Date.now() });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DISCUSSION REAL-TIME  (rooms keyed discussion:{discussionPostId})
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * discussion:join  { discussionPostId: string }
   * Joins the socket to room discussion:{discussionPostId} and returns
   * the latest messages for that discussion's chat room.
   */
  @SubscribeMessage('discussion:join')
  async handleDiscussionJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { discussionPostId: string },
  ) {
    const teacherId = client.data.teacherId;
    if (!teacherId) { client.emit('error', { code: 'UNAUTHORIZED', message: 'Not authenticated' }); return; }
    const { discussionPostId } = data ?? {};
    if (!discussionPostId) { client.emit('error', { code: 'BAD_REQUEST', message: 'discussionPostId required' }); return; }

    try {
      const room = `discussion:${discussionPostId}`;
      client.join(room);
      this.addPresence(discussionPostId, teacherId);

      const { messages, hasMore } = await this.chatService.getDiscussionMessages(discussionPostId, 50);
      client.emit('discussion:joined', {
        discussionPostId,
        messages,
        hasMore,
        onlineCount: this.getOnlineCount(discussionPostId),
      });

      this.server.to(room).emit('discussion:presence', {
        discussionPostId,
        onlineCount: this.getOnlineCount(discussionPostId),
      });

      this.logger.debug(`Teacher ${teacherId} joined discussion:${discussionPostId}`);
    } catch (err) {
      this.logger.warn(`discussion:join failed: ${err.message}`);
      client.emit('error', { code: 'ERROR', message: err.message });
    }
  }

  /** discussion:leave  { discussionPostId: string } */
  @SubscribeMessage('discussion:leave')
  handleDiscussionLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { discussionPostId: string },
  ) {
    const teacherId = client.data.teacherId;
    const { discussionPostId } = data ?? {};
    if (!discussionPostId) return;

    client.leave(`discussion:${discussionPostId}`);
    if (teacherId) {
      this.removePresence(discussionPostId, teacherId);
      this.server.to(`discussion:${discussionPostId}`).emit('discussion:presence', {
        discussionPostId,
        onlineCount: this.getOnlineCount(discussionPostId),
      });
    }
  }

  /**
   * discussion:message:send  { discussionPostId, content, replyToId? }
   * Persists to PostgreSQL then broadcasts to the discussion room.
   */
  @SubscribeMessage('discussion:message:send')
  async handleDiscussionSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { discussionPostId: string; content: string; replyToId?: string },
  ) {
    const teacherId = client.data.teacherId;
    if (!teacherId) { client.emit('error', { code: 'UNAUTHORIZED', message: 'Not authenticated' }); return; }
    const { discussionPostId, content, replyToId } = data ?? {};
    if (!discussionPostId || !content?.trim()) {
      client.emit('error', { code: 'BAD_REQUEST', message: 'discussionPostId and content required' });
      return;
    }

    try {
      const message = await this.chatService.saveDiscussionMessage(discussionPostId, teacherId, content, replyToId);
      this.server.to(`discussion:${discussionPostId}`).emit('discussion:message:new', message);
      this.logger.debug(`Discussion message saved: teacher=${teacherId} discussion=${discussionPostId}`);
      
      // Update discussion reply count and notify (async, don't block the response)
      this.updateDiscussionMetrics(discussionPostId, teacherId, message).catch(err => {
        this.logger.error(`Failed to update discussion metrics: ${err.message}`);
      });
    } catch (err) {
      this.logger.error(`discussion:message:send error: ${err.message}`);
      client.emit('error', { code: 'ERROR', message: err.message });
    }
  }

  private async updateDiscussionMetrics(discussionPostId: string, teacherId: string, message: any) {
    try {
      // Dynamic import to avoid circular dependency
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      // Increment reply count and update lastActiveAt
      await prisma.discussion.update({
        where: { id: discussionPostId },
        data: {
          replyCount: { increment: 1 },
          lastActiveAt: new Date(),
        },
      });

      // Get discussion owner for notification
      const discussion = await prisma.discussion.findUnique({
        where: { id: discussionPostId },
        select: { authorId: true, title: true },
      });

      if (discussion && discussion.authorId !== teacherId) {
        // Send notification to discussion owner
        await prisma.notification.create({
          data: {
            receiverId: discussion.authorId,
            senderId: teacherId,
            senderName: `${message.senderName}`,
            title: 'New reply to your discussion',
            message: `${message.senderName} replied to your discussion: "${discussion.title.substring(0, 50)}..."`,
            type: 'REPLY',
            referenceId: discussionPostId,
          },
        });
      }

      await prisma.$disconnect();
    } catch (err) {
      this.logger.error(`updateDiscussionMetrics error: ${err.message}`);
    }
  }

  /** discussion:message:edit  { messageId, content } */
  @SubscribeMessage('discussion:message:edit')
  async handleDiscussionEdit(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; discussionPostId: string; content: string },
  ) {
    const teacherId = client.data.teacherId;
    if (!teacherId) return;
    try {
      const updated = await this.chatService.editDiscussionMessage(data.messageId, teacherId, data.content);
      this.server.to(`discussion:${data.discussionPostId}`).emit('discussion:message:updated', updated);
    } catch (err) {
      client.emit('error', { code: 'ERROR', message: err.message });
    }
  }

  /** discussion:message:delete  { messageId, discussionPostId } */
  @SubscribeMessage('discussion:message:delete')
  async handleDiscussionDelete(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; discussionPostId: string },
  ) {
    const teacherId = client.data.teacherId;
    if (!teacherId) return;
    try {
      const result = await this.chatService.deleteDiscussionMessage(data.messageId, teacherId);
      this.server.to(`discussion:${data.discussionPostId}`).emit('discussion:message:deleted', { messageId: data.messageId });
      
      // Decrement reply count
      if (result.discussionPostId) {
        this.decrementDiscussionReplyCount(result.discussionPostId).catch(err => {
          this.logger.error(`Failed to decrement reply count: ${err.message}`);
        });
      }
    } catch (err) {
      client.emit('error', { code: 'ERROR', message: err.message });
    }
  }

  private async decrementDiscussionReplyCount(discussionPostId: string) {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.discussion.update({
        where: { id: discussionPostId },
        data: { replyCount: { decrement: 1 } },
      });
      await prisma.$disconnect();
    } catch (err) {
      this.logger.error(`decrementDiscussionReplyCount error: ${err.message}`);
    }
  }

  /** discussion:message:helpful  { messageId, discussionPostId } — toggles 👍 */
  @SubscribeMessage('discussion:message:helpful')
  async handleDiscussionHelpful(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; discussionPostId: string },
  ) {
    const teacherId = client.data.teacherId;
    if (!teacherId) return;
    try {
      const result = await this.chatService.toggleDiscussionHelpful(data.messageId, teacherId);
      this.server.to(`discussion:${data.discussionPostId}`).emit('discussion:message:reaction', {
        messageId: data.messageId,
        reaction: '👍',
        marked: result.marked,
        count: result.count,
        teacherId,
      });
    } catch (err) {
      client.emit('error', { code: 'ERROR', message: err.message });
    }
  }

  /** discussion:typing:start / stop */
  @SubscribeMessage('discussion:typing:start')
  handleDiscussionTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { discussionPostId: string; senderName: string },
  ) {
    const teacherId = client.data.teacherId;
    if (!teacherId || !data?.discussionPostId) return;
    client.to(`discussion:${data.discussionPostId}`).emit('discussion:typing:started', {
      teacherId,
      senderName: data.senderName,
    });
  }

  @SubscribeMessage('discussion:typing:stop')
  handleDiscussionTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { discussionPostId: string },
  ) {
    const teacherId = client.data.teacherId;
    if (!teacherId || !data?.discussionPostId) return;
    client.to(`discussion:${data.discussionPostId}`).emit('discussion:typing:stopped', { teacherId });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DIRECT MESSAGING (1-to-1)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * direct:join  { chatRoomId: string }
   * Joins a direct conversation room and returns recent messages.
   */
  @SubscribeMessage('direct:join')
  async handleDirectJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatRoomId: string },
  ) {
    const teacherId = client.data.teacherId;
    if (!teacherId) {
      client.emit('error', { code: 'UNAUTHORIZED', message: 'Not authenticated' });
      return;
    }

    const { chatRoomId } = data ?? {};
    if (!chatRoomId) {
      client.emit('error', { code: 'BAD_REQUEST', message: 'chatRoomId required' });
      return;
    }

    try {
      // Verify the teacher is a participant in this direct conversation
      await this.chatService.verifyDirectConversationAccess(chatRoomId, teacherId);

      const room = `direct:${chatRoomId}`;
      client.join(room);
      this.addPresence(chatRoomId, teacherId);

      const { messages, hasMore } = await this.chatService.getDirectConversationMessages(
        chatRoomId,
        teacherId,
        undefined,
        50,
      );

      client.emit('direct:joined', {
        chatRoomId,
        messages,
        hasMore,
        onlineCount: this.getOnlineCount(chatRoomId),
      });

      this.server.to(room).emit('direct:presence', {
        chatRoomId,
        onlineCount: this.getOnlineCount(chatRoomId),
      });

      this.logger.debug(`Teacher ${teacherId} joined direct:${chatRoomId}`);
    } catch (err) {
      this.logger.warn(`direct:join failed: ${err.message}`);
      client.emit('error', { code: err.status === 403 ? 'FORBIDDEN' : 'ERROR', message: err.message });
    }
  }

  /**
   * direct:leave  { chatRoomId: string }
   */
  @SubscribeMessage('direct:leave')
  handleDirectLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatRoomId: string },
  ) {
    const teacherId = client.data.teacherId;
    const { chatRoomId } = data ?? {};
    if (!chatRoomId) return;

    client.leave(`direct:${chatRoomId}`);
    if (teacherId) {
      this.removePresence(chatRoomId, teacherId);
      this.server.to(`direct:${chatRoomId}`).emit('direct:presence', {
        chatRoomId,
        onlineCount: this.getOnlineCount(chatRoomId),
      });
    }
  }

  /**
   * direct:message:send  { chatRoomId, content, replyToId? }
   * Persists to PostgreSQL then broadcasts to the direct conversation room.
   */
  @SubscribeMessage('direct:message:send')
  async handleDirectSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatRoomId: string; content: string; replyToId?: string },
  ) {
    const teacherId = client.data.teacherId;
    if (!teacherId) {
      client.emit('error', { code: 'UNAUTHORIZED', message: 'Not authenticated' });
      return;
    }

    const { chatRoomId, content, replyToId } = data ?? {};
    if (!chatRoomId || !content?.trim()) {
      client.emit('error', { code: 'BAD_REQUEST', message: 'chatRoomId and content are required' });
      return;
    }

    try {
      // Verify the teacher is a participant
      await this.chatService.verifyDirectConversationAccess(chatRoomId, teacherId);

      // Persist to PostgreSQL
      const dto: SendMessageDto = { content: content.trim(), replyToId };
      const message = await this.chatService.sendDirectMessage(chatRoomId, teacherId, dto);

      // Broadcast to the direct conversation room
      this.server.to(`direct:${chatRoomId}`).emit('direct:message:new', message);

      this.logger.debug(`Direct message saved: teacher=${teacherId} chatRoom=${chatRoomId}`);
    } catch (err) {
      this.logger.error(`direct:message:send error: ${err.message}`);
      client.emit('error', { code: err.status === 403 ? 'FORBIDDEN' : 'ERROR', message: err.message });
    }
  }

  /**
   * direct:typing:start / stop
   */
  @SubscribeMessage('direct:typing:start')
  handleDirectTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatRoomId: string },
  ) {
    const teacherId = client.data.teacherId;
    if (!teacherId || !data?.chatRoomId) return;
    client.to(`direct:${data.chatRoomId}`).emit('direct:typing:started', { teacherId });
  }

  @SubscribeMessage('direct:typing:stop')
  handleDirectTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatRoomId: string },
  ) {
    const teacherId = client.data.teacherId;
    if (!teacherId || !data?.chatRoomId) return;
    client.to(`direct:${data.chatRoomId}`).emit('direct:typing:stopped', { teacherId });
  }
}
