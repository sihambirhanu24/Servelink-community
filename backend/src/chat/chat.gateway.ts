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
}
