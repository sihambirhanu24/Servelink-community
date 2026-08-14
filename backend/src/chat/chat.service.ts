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
import { CommunityType, CommunitySubtype } from '@prisma/client';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Numeric rank for each teacher level */
const LEVEL_RANK: Record<string, number> = {
  LEVEL_1: 1,
  LEVEL_2: 2,
  LEVEL_3: 3,
  LEVEL_4: 4,
  LEVEL_5: 5,
};

/**
 * The exact community type that corresponds to each level rank.
 * LEVEL_1 → SCHOOL, LEVEL_2 → WOREDA, etc.
 */
const RANK_TO_TYPE: Record<number, CommunityType> = {
  1: CommunityType.SCHOOL,
  2: CommunityType.WOREDA,
  3: CommunityType.ZONE,
  4: CommunityType.REGION,
  5: CommunityType.NATIONAL,
};

const ALLOWED_REACTIONS = ['👍', '❤️', '😂', '👏', '😮', '🙏'];

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeacherProfile {
  level: string;
  school: string | null;
  woreda: string | null;
  zone: string | null;
  region: string | null;
  department: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Case-insensitive string equality — null/undefined never matches */
function ci(a: string | null | undefined, b: string | null | undefined): boolean {
  return !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class ChatService {
  private readonly userMessageTimestamps = new Map<string, number[]>();

  constructor(private readonly prisma: PrismaService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // COMMUNITY UPSERT  (idempotent, race-condition safe)
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Find or create ONE canonical Community + its ChatRoom for the given scope.
   * Idempotent — safe to call concurrently or repeatedly.
   *
   * Scope rules:
   *   LEVEL_1 / SCHOOL  → subtype COMMON,      no department
   *   LEVEL_2-5 COMMON  → subtype COMMON,      no department
   *   LEVEL_2-5 DEPT    → subtype DEPARTMENT,  department set
   */
  async upsertCommunityWithChatRoom(params: {
    type: CommunityType;
    subtype: CommunitySubtype;
    name: string;
    school?: string | null;
    woreda?: string | null;
    zone?: string | null;
    region?: string | null;
    department?: string | null;
  }): Promise<{ communityId: string; chatRoomId: string }> {
    const { type, subtype, name, school, woreda, zone, region, department } = params;

    const geoFilter = {
      school:     school     ?? null,
      woreda:     woreda     ?? null,
      zone:       zone       ?? null,
      region:     region     ?? null,
      department: department ?? null,
    };

    let community = await this.prisma.community.findFirst({
      where: { type, subtype, ...geoFilter },
    });

    if (!community) {
      try {
        community = await this.prisma.community.create({
          data: { type, subtype, name, ...geoFilter },
        });
      } catch (e: any) {
        // P2002 = unique constraint violation — concurrent creation, just fetch it
        if (e.code === 'P2002') {
          community = await this.prisma.community.findFirst({
            where: { type, subtype, ...geoFilter },
          });
          if (!community) throw e;
        } else {
          throw e;
        }
      }
    }

    // Ensure chat room exists
    let chatRoom = await this.prisma.chatRoom.findUnique({
      where: { communityId: community.id },
    });
    if (!chatRoom) {
      try {
        chatRoom = await this.prisma.chatRoom.create({
          data: { communityId: community.id },
        });
      } catch (e: any) {
        if (e.code === 'P2002') {
          chatRoom = await this.prisma.chatRoom.findUnique({
            where: { communityId: community.id },
          });
          if (!chatRoom) throw e;
        } else {
          throw e;
        }
      }
    }

    return { communityId: community.id, chatRoomId: chatRoom.id };
  }

  /**
   * Auto-provisions every community (+ ChatRoom) a teacher is entitled to.
   * Called on first access — idempotent.
   *
   *   LEVEL_1  → 1 community:  SCHOOL/COMMON   scoped to teacher.school
   *   LEVEL_2  → 2 communities: WOREDA/COMMON + WOREDA/DEPARTMENT (if dept set)
   *   LEVEL_3  → 2 communities: ZONE/COMMON   + ZONE/DEPARTMENT   (if dept set)
   *   LEVEL_4  → 2 communities: REGION/COMMON + REGION/DEPARTMENT (if dept set)
   *   LEVEL_5  → 2 communities: NATIONAL/COMMON + NATIONAL/DEPT   (if dept set)
   */
  async ensureTeacherCommunities(teacher: TeacherProfile): Promise<void> {
    const rank = LEVEL_RANK[teacher.level] ?? 1;
    const ops: Promise<any>[] = [];

    if (rank === 1) {
      if (teacher.school) {
        ops.push(
          this.upsertCommunityWithChatRoom({
            type: CommunityType.SCHOOL,
            subtype: CommunitySubtype.COMMON,
            name: `${teacher.school} Community`,
            school: teacher.school,
          }),
        );
      }
    } else {
      const type = RANK_TO_TYPE[rank];
      if (!type) return;
      const geoFields = this.geoFieldsForRank(rank, teacher);
      const geoLabel  = this.geoLabelForRank(rank, teacher);

      // COMMON community (all teachers at this level/scope)
      ops.push(
        this.upsertCommunityWithChatRoom({
          type,
          subtype: CommunitySubtype.COMMON,
          name: `${geoLabel} Community`,
          ...geoFields,
          department: null,
        }),
      );

      // DEPARTMENT community (teachers in the same dept at this scope)
      if (teacher.department) {
        ops.push(
          this.upsertCommunityWithChatRoom({
            type,
            subtype: CommunitySubtype.DEPARTMENT,
            name: `${geoLabel} ${teacher.department} Community`,
            ...geoFields,
            department: teacher.department,
          }),
        );
      }
    }

    await Promise.all(ops);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // GET ACCESSIBLE CHAT GROUPS  (GET /chat/groups)
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Returns all chat communities the authenticated teacher may access.
   *
   * Authorization derived entirely from teacher's DB profile — no CommunityMember
   * records consulted.  Each teacher sees communities ONLY at their own level:
   *
   *   LEVEL_1 → 1 group:  their School community
   *   LEVEL_2 → up to 2:  Woreda COMMON + Woreda DEPARTMENT (if dept set)
   *   LEVEL_3 → up to 2:  Zone COMMON + Zone DEPARTMENT
   *   LEVEL_4 → up to 2:  Region COMMON + Region DEPARTMENT
   *   LEVEL_5 → up to 2:  National COMMON + National DEPARTMENT
   */
  async getAccessibleChatGroups(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: {
        level: true,
        school: true,
        woreda: true,
        zone: true,
        region: true,
        department: true,
      },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    console.log(`[ChatService] getAccessibleChatGroups for teacher ${teacherId}:`, {
      level: teacher.level,
      department: teacher.department,
      zone: teacher.zone,
      woreda: teacher.woreda,
      region: teacher.region,
    });

    // Provision communities this teacher is entitled to (idempotent)
    await this.ensureTeacherCommunities(teacher);

    const clauses = this.accessibleCommunityClauses(teacher);
    console.log(`[ChatService] Access clauses count: ${clauses.length}`);
    if (clauses.length === 0) return [];

    const communities = await this.prisma.community.findMany({
      where: { OR: clauses, isActive: true },
      include: {
        chatRoom: {
          include: {
            messages: {
              where: { deletedAt: null },
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { sender: { select: { firstName: true, lastName: true } } },
            },
            unreadCounts: {
              where: { teacherId },
              select: { count: true },
            },
          },
        },
        _count: { select: { communityMembers: true } },
      },
      orderBy: [{ type: 'asc' }, { subtype: 'asc' }, { name: 'asc' }],
    });

    console.log(`[ChatService] Found ${communities.length} communities:`);
    communities.forEach((c) => {
      console.log(`  - ${c.name} (${c.type}/${c.subtype}, dept: ${c.department})`);
    });

    return communities.map((c) => {
      const last   = c.chatRoom?.messages[0] ?? null;
      const unread = c.chatRoom?.unreadCounts[0]?.count ?? 0;
      return {
        id:          c.id,
        name:        c.name,
        type:        c.type,
        subtype:     c.subtype,
        department:  c.department,
        description: c.description,
        school:      c.school,
        woreda:      c.woreda,
        zone:        c.zone,
        region:      c.region,
        isActive:    c.isActive,
        chatRoomId:  c.chatRoom?.id ?? null,
        memberCount: c._count.communityMembers,
        unreadCount: unread,
        lastMessage: last
          ? {
              content:    last.content.substring(0, 100),
              senderName: `${last.sender.firstName} ${last.sender.lastName}`,
              createdAt:  last.createdAt,
            }
          : null,
      };
    });
  }

  /**
   * Build the exact Prisma OR filter for communities this teacher can access.
   *
   * LEVEL_1 → SCHOOL/COMMON matching teacher.school
   * LEVEL_2 → WOREDA/COMMON matching teacher.woreda
   *           WOREDA/DEPARTMENT matching teacher.woreda + teacher.department
   * LEVEL_3 → ZONE/COMMON + ZONE/DEPARTMENT  (analogous)
   * LEVEL_4 → REGION/COMMON + REGION/DEPARTMENT
   * LEVEL_5 → NATIONAL/COMMON + NATIONAL/DEPARTMENT
   *
   * Teachers see communities ONLY at their own level, not all levels below.
   */
  private accessibleCommunityClauses(teacher: TeacherProfile): any[] {
    const rank = LEVEL_RANK[teacher.level] ?? 1;
    const clauses: any[] = [];

    if (rank === 1) {
      if (teacher.school) {
        clauses.push({
          type:    CommunityType.SCHOOL,
          subtype: CommunitySubtype.COMMON,
          school:  { equals: teacher.school, mode: 'insensitive' as const },
        });
      }
      return clauses;
    }

    const type = RANK_TO_TYPE[rank];
    if (!type) return clauses;
    const geoClause = this.geoClauseForRank(rank, teacher);

    // COMMON community
    clauses.push({ type, subtype: CommunitySubtype.COMMON, ...geoClause });

    // DEPARTMENT community — only if teacher has a department
    if (teacher.department) {
      clauses.push({
        type,
        subtype:    CommunitySubtype.DEPARTMENT,
        ...geoClause,
        department: { equals: teacher.department, mode: 'insensitive' as const },
      });
    }

    return clauses;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ACCESS VERIFICATION  (every message / WS join goes through this)
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Verifies the authenticated teacher may access the given community.
   * Enforces ALL four rules:
   *
   *   1. Teacher level rank must EQUAL the community's required rank.
   *      (No cross-level access — a LEVEL_5 cannot read SCHOOL chats.)
   *   2. Geographic scope must match.
   *   3. For DEPARTMENT communities: teacher.department must match.
   *   4. Community must be active.
   *
   * Throws ForbiddenException with an explanatory message on failure.
   * Returns the Community record on success.
   */
  async verifyAndGetCommunity(communityId: string, teacherId: string) {
    const [community, teacher] = await Promise.all([
      this.prisma.community.findUnique({ where: { id: communityId } }),
      this.prisma.teacher.findUnique({
        where: { id: teacherId },
        select: {
          level:      true,
          school:     true,
          woreda:     true,
          zone:       true,
          region:     true,
          department: true,
        },
      }),
    ]);

    if (!community) throw new NotFoundException('Community not found');
    if (!teacher)   throw new NotFoundException('Teacher not found');
    if (!community.isActive) {
      throw new ForbiddenException('This community is currently inactive.');
    }

    const teacherRank = LEVEL_RANK[teacher.level] ?? 1;

    // Map community type back to its required rank
    const typeToRank: Record<string, number> = {
      SCHOOL: 1, WOREDA: 2, ZONE: 3, REGION: 4, NATIONAL: 5,
    };
    const communityRank = typeToRank[community.type] ?? 99;

    // Rule 1 — exact level match
    if (teacherRank !== communityRank) {
      throw new ForbiddenException(
        teacherRank < communityRank
          ? `Your level (${teacher.level}) does not have access to ${community.type} communities.`
          : `This community is for ${community.type} level teachers. Your level is ${teacher.level}.`,
      );
    }

    // Rule 2 — geographic scope
    if (community.type !== CommunityType.NATIONAL) {
      if (!this.inGeographicScope(community, teacher)) {
        throw new ForbiddenException(
          'This community is outside your authorized geographic scope.',
        );
      }
    }

    // Rule 3 — department (DEPARTMENT subtype only)
    if (community.subtype === CommunitySubtype.DEPARTMENT) {
      if (!community.department) {
        throw new ForbiddenException('This department community has no department configured.');
      }
      if (!ci(community.department, teacher.department)) {
        throw new ForbiddenException(
          `This community is for the ${community.department} department. ` +
          `Your department (${teacher.department ?? 'none'}) does not match.`,
        );
      }
    }

    return community;
  }

  private inGeographicScope(
    c: { type: string; school?: string | null; woreda?: string | null; zone?: string | null; region?: string | null },
    t: { school?: string | null; woreda?: string | null; zone?: string | null; region?: string | null },
  ): boolean {
    switch (c.type) {
      case 'SCHOOL':   return ci(c.school,  t.school);
      case 'WOREDA':   return ci(c.woreda,  t.woreda);
      case 'ZONE':     return ci(c.zone,    t.zone);
      case 'REGION':   return ci(c.region,  t.region);
      case 'NATIONAL': return true;
      default:         return false;
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CHAT ROOM HELPERS
  // ───────────────────────────────────────────────────────────────────────────

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

  // ───────────────────────────────────────────────────────────────────────────
  // MESSAGES
  // ───────────────────────────────────────────────────────────────────────────

  async getMessageHistory(
    chatRoomId: string,
    limit = 50,
    offset = 0,
  ): Promise<{ messages: ChatMessageResponseDto[]; total: number }> {
    const [rows, total] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where: { chatRoomId, deletedAt: null },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, level: true, profileImage: true } },
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
        sender: { select: { id: true, firstName: true, lastName: true, level: true, profileImage: true } },
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

  // ───────────────────────────────────────────────────────────────────────────
  // REACTIONS, EDIT, DELETE, PIN
  // ───────────────────────────────────────────────────────────────────────────

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

  // ───────────────────────────────────────────────────────────────────────────
  // UNREAD
  // ───────────────────────────────────────────────────────────────────────────

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
        where: { chatRoomId: chatRoom.id, readBy: { none: { teacherId } }, deletedAt: null },
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

  // ───────────────────────────────────────────────────────────────────────────
  // PRESENCE
  // ───────────────────────────────────────────────────────────────────────────

  getOnlineCount(roomSet: Set<string>): number {
    return roomSet.size;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // GEO HELPERS  (private)
  // ───────────────────────────────────────────────────────────────────────────

  /** Geographic data fields to include on a community for a given level rank */
  private geoFieldsForRank(
    rank: number,
    t: TeacherProfile,
  ): { school?: null; woreda?: string | null; zone?: string | null; region?: string | null } {
    switch (rank) {
      case 2: return { woreda: t.woreda };
      case 3: return { zone:   t.zone   };
      case 4: return { region: t.region };
      case 5: return {};
      default: return {};
    }
  }

  /** Prisma WHERE clause for geographic matching at a given level rank */
  private geoClauseForRank(rank: number, t: TeacherProfile): Record<string, any> {
    switch (rank) {
      case 2: return t.woreda ? { woreda: { equals: t.woreda, mode: 'insensitive' as const } } : {};
      case 3: return t.zone   ? { zone:   { equals: t.zone,   mode: 'insensitive' as const } } : {};
      case 4: return t.region ? { region: { equals: t.region, mode: 'insensitive' as const } } : {};
      case 5: return {};
      default: return {};
    }
  }

  /** Human-readable label for the community scope */
  private geoLabelForRank(rank: number, t: TeacherProfile): string {
    switch (rank) {
      case 2: return t.woreda ?? 'Woreda';
      case 3: return t.zone   ?? 'Zone';
      case 4: return t.region ?? 'Region';
      case 5: return 'National';
      default: return 'Unknown';
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // FORMAT HELPERS
  // ───────────────────────────────────────────────────────────────────────────

  formatMessage(message: any, sender: any): ChatMessageResponseDto {
    const reactions: Record<string, number> = {};
    if (message.reactions) {
      for (const r of message.reactions) {
        reactions[r.reaction] = (reactions[r.reaction] ?? 0) + 1;
      }
    }
    return {
      id:                 message.id,
      chatRoomId:         message.chatRoomId,
      senderId:           sender.id,
      senderName:         `${sender.firstName} ${sender.lastName}`,
      senderProfileImage: sender.profileImage ?? null,
      senderLevel:        sender.level,
      content:            message.content,
      replyToId:          message.replyToId   ?? undefined,
      editedAt:           message.editedAt    ?? undefined,
      deletedAt:          message.deletedAt   ?? undefined,
      attachments:        message.attachments ?? [],
      reactions,
      isPinned:           !!message.pinnedMessage,
      createdAt:          message.createdAt,
      updatedAt:          message.updatedAt,
    };
  }
}
