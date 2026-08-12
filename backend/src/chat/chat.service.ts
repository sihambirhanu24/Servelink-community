import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChatMessageResponseDto } from './dto/chat-message-response.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { EditMessageDto } from './dto/edit-message.dto';
import { AddReactionDto } from './dto/add-reaction.dto';

/** Numeric rank for each teacher level */
const LEVEL_RANK: Record<string, number> = {
  LEVEL_1: 1,
  LEVEL_2: 2,
  LEVEL_3: 3,
  LEVEL_4: 4,
  LEVEL_5: 5,
};

/** Minimum level required to access each community type */
const TYPE_MIN_LEVEL: Record<string, number> = {
  SCHOOL: 1,
  WOREDA: 2,
  ZONE: 3,
  REGION: 4,
  NATIONAL: 5,
};

const ALLOWED_REACTIONS = ['👍', '❤️', '😂', '👏', '😮', '🙏'];

/** Case-insensitive string equality */
function ci(a: string | null | undefined, b: string | null | undefined): boolean {
  return !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();
}

@Injectable()
export class ChatService {
  private readonly userMessageTimestamps = new Map<string, number[]>();

  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // COMMUNITY UPSERT — auto-create the teacher's geographic communities
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Find or create the single canonical Community record for a given
   * type+geography scope, then ensure its ChatRoom exists.
   * This is idempotent: calling it multiple times is safe.
   */
  async upsertCommunityWithChatRoom(
    type: 'SCHOOL' | 'WOREDA' | 'ZONE' | 'REGION' | 'NATIONAL',
    geo: { school?: string; woreda?: string; zone?: string; region?: string },
  ): Promise<{ communityId: string; chatRoomId: string }> {
    let where: any;
    let name: string;
    let data: any;

    switch (type) {
      case 'SCHOOL':
        where = { type, school: { equals: geo.school, mode: 'insensitive' as const } };
        name = `${geo.school} Community`;
        data = { type, name, school: geo.school };
        break;
      case 'WOREDA':
        where = { type, woreda: { equals: geo.woreda, mode: 'insensitive' as const } };
        name = `${geo.woreda} Woreda Community`;
        data = { type, name, woreda: geo.woreda };
        break;
      case 'ZONE':
        where = { type, zone: { equals: geo.zone, mode: 'insensitive' as const } };
        name = `${geo.zone} Zone Community`;
        data = { type, name, zone: geo.zone };
        break;
      case 'REGION':
        where = { type, region: { equals: geo.region, mode: 'insensitive' as const } };
        name = `${geo.region} Region Community`;
        data = { type, name, region: geo.region };
        break;
      case 'NATIONAL':
        where = { type };
        name = 'National Community';
        data = { type, name };
        break;
    }

    // Find first matching community (case-insensitive via Prisma mode)
    let community = await this.prisma.community.findFirst({ where });

    if (!community) {
      community = await this.prisma.community.create({ data });
    }

    // Ensure chat room exists
    let chatRoom = await this.prisma.chatRoom.findUnique({
      where: { communityId: community.id },
    });
    if (!chatRoom) {
      chatRoom = await this.prisma.chatRoom.create({
        data: { communityId: community.id },
      });
    }

    return { communityId: community.id, chatRoomId: chatRoom.id };
  }

  /**
   * Called by getAccessibleChatGroups BEFORE querying.
   * Auto-creates all community + chat room records the teacher is entitled to,
   * based purely on their level and geographic fields.
   */
  async ensureTeacherCommunities(teacher: {
    level: string;
    school: string;
    woreda: string;
    zone: string;
    region: string;
  }): Promise<void> {
    const rank = LEVEL_RANK[teacher.level] ?? 1;
    const ops: Promise<any>[] = [];

    if (rank >= 1 && teacher.school) {
      ops.push(this.upsertCommunityWithChatRoom('SCHOOL', { school: teacher.school }));
    }
    if (rank >= 2 && teacher.woreda) {
      ops.push(this.upsertCommunityWithChatRoom('WOREDA', { woreda: teacher.woreda }));
    }
    if (rank >= 3 && teacher.zone) {
      ops.push(this.upsertCommunityWithChatRoom('ZONE', { zone: teacher.zone }));
    }
    if (rank >= 4 && teacher.region) {
      ops.push(this.upsertCommunityWithChatRoom('REGION', { region: teacher.region }));
    }
    if (rank >= 5) {
      ops.push(this.upsertCommunityWithChatRoom('NATIONAL', {}));
    }

    await Promise.all(ops);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ACCESSIBLE GROUPS — the core endpoint logic
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Return all chat groups the authenticated teacher can access.
   * Access is determined SOLELY by teacher.level + geographic fields.
   * NO CommunityMember records are required or consulted.
   */
  async getAccessibleChatGroups(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { level: true, school: true, woreda: true, zone: true, region: true },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    // Guarantee all entitled Community + ChatRoom records exist
    await this.ensureTeacherCommunities({
      level: teacher.level,
      school: teacher.school ?? '',
      woreda: teacher.woreda ?? '',
      zone: teacher.zone ?? '',
      region: teacher.region ?? '',
    });

    const rank = LEVEL_RANK[teacher.level] ?? 1;
    const orClauses: any[] = [];

    if (rank >= 1 && teacher.school) {
      orClauses.push({ type: 'SCHOOL', school: { equals: teacher.school, mode: 'insensitive' } });
    }
    if (rank >= 2 && teacher.woreda) {
      orClauses.push({ type: 'WOREDA', woreda: { equals: teacher.woreda, mode: 'insensitive' } });
    }
    if (rank >= 3 && teacher.zone) {
      orClauses.push({ type: 'ZONE', zone: { equals: teacher.zone, mode: 'insensitive' } });
    }
    if (rank >= 4 && teacher.region) {
      orClauses.push({ type: 'REGION', region: { equals: teacher.region, mode: 'insensitive' } });
    }
    if (rank >= 5) {
      orClauses.push({ type: 'NATIONAL' });
    }

    if (orClauses.length === 0) return [];

    const communities = await this.prisma.community.findMany({
      where: { OR: orClauses },
      include: {
        chatRoom: {
          include: {
            messages: {
              where: { deletedAt: null },
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                sender: { select: { firstName: true, lastName: true } },
              },
            },
            unreadCounts: {
              where: { teacherId },
              select: { count: true },
            },
          },
        },
        // Count teachers whose geographic scope matches this community
        // (approximate member count — no CommunityMember required)
        _count: { select: { communityMembers: true } },
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    return communities.map((c) => {
      const last = c.chatRoom?.messages[0] ?? null;
      const unread = c.chatRoom?.unreadCounts[0]?.count ?? 0;

      return {
        id: c.id,
        name: c.name,
        type: c.type,
        description: c.description,
        school: c.school,
        woreda: c.woreda,
        zone: c.zone,
        region: c.region,
        chatRoomId: c.chatRoom?.id ?? null,
        unreadCount: unread,
        lastMessage: last
          ? {
              content: last.content.substring(0, 100),
              senderName: `${last.sender.firstName} ${last.sender.lastName}`,
              createdAt: last.createdAt,
            }
          : null,
      };
    });
  }
  

  // ─────────────────────────────────────────────────────────────────────────
  // ACCESS VERIFICATION — enforced on every message and join request
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Verify teacher has access to a community by level AND geography.
   * Throws ForbiddenException if not authorized.
   * Returns the Community record on success.
   */
  async verifyAndGetCommunity(communityId: string, teacherId: string) {
    const [community, teacher] = await Promise.all([
      this.prisma.community.findUnique({ where: { id: communityId } }),
      this.prisma.teacher.findUnique({
        where: { id: teacherId },
        select: { level: true, school: true, woreda: true, zone: true, region: true },
      }),
    ]);

    if (!community) throw new NotFoundException('Community not found');
    if (!teacher) throw new NotFoundException('Teacher not found');

    const rank = LEVEL_RANK[teacher.level] ?? 1;
    const required = TYPE_MIN_LEVEL[community.type] ?? 99;

    if (rank < required) {
      throw new ForbiddenException(
        `Your level (${teacher.level}) does not have access to ${community.type} communities.`,
      );
    }

    if (community.type !== 'NATIONAL') {
      if (!this.isInGeographicScope(community, teacher)) {
        throw new ForbiddenException(
          'This community is outside your authorized geographic scope.',
        );
      }
    }

    return community;
  }

  private isInGeographicScope(
    c: { type: string; school?: string | null; woreda?: string | null; zone?: string | null; region?: string | null },
    t: { school?: string | null; woreda?: string | null; zone?: string | null; region?: string | null },
  ): boolean {
    switch (c.type) {
      case 'SCHOOL':  return ci(c.school, t.school);
      case 'WOREDA':  return ci(c.woreda, t.woreda);
      case 'ZONE':    return ci(c.zone, t.zone);
      case 'REGION':  return ci(c.region, t.region);
      case 'NATIONAL': return true;
      default: return false;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CHAT ROOM HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  async getOrCreateChatRoom(communityId: string) {
    const existing = await this.prisma.chatRoom.findUnique({ where: { communityId } });
    if (existing) return existing;
    return this.prisma.chatRoom.create({ data: { communityId } });
  }

  async getCommunityWithChatRoom(communityId: string) {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      include: {
        chatRoom: true,
        _count: { select: { communityMembers: true } },
      },
    });
    if (!community) throw new NotFoundException('Community not found');
    return community;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MESSAGES
  // ─────────────────────────────────────────────────────────────────────────

  async getMessageHistory(
    chatRoomId: string,
    limit = 50,
    offset = 0,
  ): Promise<{ messages: ChatMessageResponseDto[]; total: number }> {
    const [rows, total] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where: { chatRoomId, deletedAt: null },
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, level: true, profileImage: true },
          },
          reactions: true,
          pinnedMessage: true,
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.chatMessage.count({ where: { chatRoomId, deletedAt: null } }),
    ]);

    return { messages: rows.map((m) => this.formatMessage(m, m.sender)), total };
  }

  async getRecentMessages(chatRoomId: string, limit = 50): Promise<ChatMessageResponseDto[]> {
    const rows = await this.prisma.chatMessage.findMany({
      where: { chatRoomId, deletedAt: null },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, level: true, profileImage: true },
        },
        reactions: true,
        pinnedMessage: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.reverse().map((m) => this.formatMessage(m, m.sender));
  }

  async saveMessageWithAttachments(
    chatRoomId: string,
    senderId: string,
    dto: SendMessageDto,
    attachmentUrls: string[] = [],
  ): Promise<ChatMessageResponseDto> {
    const sender = await this.prisma.teacher.findUnique({
      where: { id: senderId },
      select: { id: true, firstName: true, lastName: true, level: true, profileImage: true },
    });
    if (!sender) throw new NotFoundException('Sender not found');

    if (!this.checkRateLimit(senderId)) {
      throw new BadRequestException('Message rate limit exceeded. Please wait a moment.');
    }

    const createData: any = { chatRoomId, senderId, content: dto.content };
    if (dto.replyToId) createData.replyToId = dto.replyToId;

    const message = await this.prisma.chatMessage.create({
      data: createData,
      include: { reactions: true, pinnedMessage: true },
    });

    if (attachmentUrls?.length) {
      await this.prisma.chatAttachment.createMany({
        data: attachmentUrls.map((url) => ({
          messageId: message.id,
          url,
          fileName: url.split('/').pop() ?? 'attachment',
          fileSize: 0,
          type: this.getAttachmentType(url),
        })),
      });
    }

    return this.formatMessage(message, sender);
  }

  async saveMessage(chatRoomId: string, senderId: string, dto: SendMessageDto) {
    return this.saveMessageWithAttachments(chatRoomId, senderId, dto, []);
  }

  private checkRateLimit(teacherId: string): boolean {
    const now = Date.now();
    const ts = this.userMessageTimestamps.get(teacherId) ?? [];
    const recent = ts.filter((t) => now - t < 1000);
    if (recent.length >= 1) return false;
    recent.push(now);
    this.userMessageTimestamps.set(teacherId, recent);
    return true;
  }

  private getAttachmentType(url: string): any {
    const ext = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext ?? '')) return 'IMAGE';
    if (ext === 'pdf') return 'PDF';
    if (['docx', 'doc'].includes(ext ?? '')) return 'DOCX';
    if (['mp4', 'webm', 'mov'].includes(ext ?? '')) return 'VIDEO';
    return 'IMAGE';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REACTIONS, EDIT, DELETE, PIN
  // ─────────────────────────────────────────────────────────────────────────

  async addReaction(messageId: string, communityId: string, teacherId: string, dto: AddReactionDto) {
    await this.verifyAndGetCommunity(communityId, teacherId);
    if (!ALLOWED_REACTIONS.includes(dto.reaction)) {
      throw new BadRequestException('Invalid reaction emoji');
    }
    const message = await this.prisma.chatMessage.findFirst({
      where: { id: messageId, chatRoom: { communityId } },
    });
    if (!message) throw new NotFoundException('Message not found in this community');
    if (message.deletedAt) throw new BadRequestException('Cannot react to a deleted message');

    return this.prisma.chatReaction.upsert({
      where: { messageId_teacherId_reaction: { messageId, teacherId, reaction: dto.reaction } },
      update: { createdAt: new Date() },
      create: { messageId, teacherId, reaction: dto.reaction },
      include: { teacher: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async removeReaction(messageId: string, communityId: string, teacherId: string, reaction: string) {
    await this.verifyAndGetCommunity(communityId, teacherId);
    await this.prisma.chatReaction.deleteMany({ where: { messageId, teacherId, reaction } });
  }

  async editMessage(messageId: string, communityId: string, teacherId: string, dto: EditMessageDto) {
    await this.verifyAndGetCommunity(communityId, teacherId);
    const message = await this.prisma.chatMessage.findFirst({
      where: { id: messageId, chatRoom: { communityId } },
    });
    if (!message) throw new NotFoundException('Message not found');
    if (message.deletedAt) throw new BadRequestException('Cannot edit a deleted message');
    if (message.senderId !== teacherId) throw new ForbiddenException('You can only edit your own messages');

    const updated = await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { content: dto.content, editedAt: new Date() },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, level: true, profileImage: true } },
        reactions: true,
        pinnedMessage: true,
      },
    });
    return this.formatMessage(updated, updated.sender);
  }

  async deleteMessage(messageId: string, communityId: string, teacherId: string) {
    await this.verifyAndGetCommunity(communityId, teacherId);
    const message = await this.prisma.chatMessage.findFirst({
      where: { id: messageId, chatRoom: { communityId } },
    });
    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId !== teacherId) throw new ForbiddenException('You can only delete your own messages');
    await this.prisma.chatMessage.update({ where: { id: messageId }, data: { deletedAt: new Date() } });
  }

  async pinMessage(messageId: string, communityId: string, teacherId: string) {
    await this.verifyAndGetCommunity(communityId, teacherId);
    const chatRoom = await this.prisma.chatRoom.findUnique({ where: { communityId } });
    if (!chatRoom) throw new NotFoundException('Chat room not found');
    const msg = await this.prisma.chatMessage.findFirst({ where: { id: messageId, chatRoomId: chatRoom.id } });
    if (!msg) throw new NotFoundException('Message not found');
    return this.prisma.pinnedMessage.upsert({
      where: { messageId },
      update: { pinnedBy: teacherId },
      create: { chatRoomId: chatRoom.id, messageId, pinnedBy: teacherId },
    });
  }

  async unpinMessage(messageId: string, communityId: string, teacherId: string) {
    await this.verifyAndGetCommunity(communityId, teacherId);
    await this.prisma.pinnedMessage.deleteMany({ where: { messageId } });
  }

  async getPinnedMessages(communityId: string, teacherId: string) {
    await this.verifyAndGetCommunity(communityId, teacherId);
    const chatRoom = await this.prisma.chatRoom.findUnique({ where: { communityId } });
    if (!chatRoom) return [];
    const rows = await this.prisma.chatMessage.findMany({
      where: { chatRoomId: chatRoom.id, pinnedMessage: { isNot: null } },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, level: true, profileImage: true } },
        reactions: true,
        pinnedMessage: true,
      },
      orderBy: { pinnedMessage: { createdAt: 'desc' } },
    });
    return rows.map((m) => this.formatMessage(m, m.sender));
  }

  async searchMessages(chatRoomId: string, communityId: string, teacherId: string, query: string, limit = 20) {
    await this.verifyAndGetCommunity(communityId, teacherId);
    const rows = await this.prisma.chatMessage.findMany({
      where: { chatRoomId, content: { contains: query, mode: 'insensitive' }, deletedAt: null },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, level: true, profileImage: true } },
        reactions: true,
        pinnedMessage: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((m) => this.formatMessage(m, m.sender));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UNREAD
  // ─────────────────────────────────────────────────────────────────────────

  async markMessagesAsRead(messageIds: string[], communityId: string, teacherId: string) {
    await this.verifyAndGetCommunity(communityId, teacherId);
    const messages = await this.prisma.chatMessage.findMany({
      where: { id: { in: messageIds }, chatRoom: { communityId } },
    });
    if (messages.length !== messageIds.length) {
      throw new BadRequestException('Some messages not found in this community');
    }
    await Promise.all(
      messageIds.map((messageId) =>
        this.prisma.chatMessageRead.upsert({
          where: { messageId_teacherId: { messageId, teacherId } },
          update: {},
          create: { messageId, teacherId },
        }),
      ),
    );
    const chatRoom = await this.prisma.chatRoom.findUnique({ where: { communityId } });
    if (chatRoom) {
      const unreadCount = await this.prisma.chatMessage.count({
        where: {
          chatRoomId: chatRoom.id,
          readBy: { none: { teacherId } },
          deletedAt: null,
        },
      });
      await this.prisma.chatUnreadCount.upsert({
        where: { chatRoomId_teacherId: { chatRoomId: chatRoom.id, teacherId } },
        update: { count: unreadCount },
        create: { chatRoomId: chatRoom.id, teacherId, count: unreadCount },
      });
    }
  }

  async getUnreadCount(communityId: string, teacherId: string): Promise<number> {
    await this.verifyAndGetCommunity(communityId, teacherId);
    const chatRoom = await this.prisma.chatRoom.findUnique({ where: { communityId } });
    if (!chatRoom) return 0;
    const record = await this.prisma.chatUnreadCount.findUnique({
      where: { chatRoomId_teacherId: { chatRoomId: chatRoom.id, teacherId } },
    });
    return record?.count ?? 0;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRESENCE
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Count teachers who are currently online (tracked by gateway) in a room.
   * The gateway passes the live set; this method just formats the result.
   */
  getOnlineCount(roomSet: Set<string>): number {
    return roomSet.size;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FORMAT HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  formatMessage(message: any, sender: any): ChatMessageResponseDto {
    const reactions: Record<string, number> = {};
    if (message.reactions) {
      for (const r of message.reactions) {
        reactions[r.reaction] = (reactions[r.reaction] ?? 0) + 1;
      }
    }
    return {
      id: message.id,
      chatRoomId: message.chatRoomId,
      senderId: sender.id,
      senderName: `${sender.firstName} ${sender.lastName}`,
      senderProfileImage: sender.profileImage ?? null,
      senderLevel: sender.level,
      content: message.content,
      replyToId: message.replyToId ?? undefined,
      editedAt: message.editedAt ?? undefined,
      deletedAt: message.deletedAt ?? undefined,
      attachments: message.attachments ?? [],
      reactions,
      isPinned: !!message.pinnedMessage,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }
}
