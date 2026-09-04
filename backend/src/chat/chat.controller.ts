import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { SuspensionGuard } from '../suspension/guards/suspension.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import { ChatMessageResponseDto } from './dto/chat-message-response.dto';
import { AddReactionDto } from './dto/add-reaction.dto';
import { EditMessageDto } from './dto/edit-message.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { CreateDirectConversationDto } from './dto/create-direct-conversation.dto';

/**
 * GET /api/chat/groups
 * Returns the list of chat groups the authenticated teacher can access.
 * Access is derived PURELY from teacher.level + geographic fields.
 * No CommunityMember record is required.
 */
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatGroupsController {
  constructor(private readonly chatService: ChatService) {}

  @Get('groups')
  async getAccessibleChatGroups(@CurrentUser() user: any) {
    // user.sub is the teacher id from JWT payload
    const teacherId = user.sub ?? user.id;
    return {
      groups: await this.chatService.getAccessibleChatGroups(teacherId),
    };
  }
}

/**
 * Routes for individual community chat operations.
 * All routes verify the requesting teacher has geographic + level access
 * before returning any data.
 */
@Controller('community/:communityId/chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * GET /api/community/:communityId/chat/messages?page=1&limit=50
   * Returns paginated message history (oldest-first within the page).
   */
  @Get('messages')
  async getMessages(
    @Param('communityId') communityId: string,
    @CurrentUser() user: any,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ): Promise<{
    messages: ChatMessageResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const teacherId = user.sub ?? user.id;
    await this.chatService.verifyAndGetCommunity(communityId, teacherId);
    const chatRoom = await this.chatService.getOrCreateChatRoom(communityId);
    const offset = (page - 1) * limit;
    const { messages, total } = await this.chatService.getMessageHistory(
      chatRoom.id,
      limit,
      offset,
      teacherId,
    );
    return { messages, total, page, limit };
  }

  /**
   * GET /api/community/:communityId/chat/info
   * Returns community metadata: name, type, member counts, chatRoomId.
   */
  @Get('info')
  async getChatInfo(
    @Param('communityId') communityId: string,
    @CurrentUser() user: any,
  ) {
    const teacherId = user.sub ?? user.id;
    const community = await this.chatService.verifyAndGetCommunity(
      communityId,
      teacherId,
    );
    const chatRoom = await this.chatService.getOrCreateChatRoom(communityId);
    return { community, chatRoomId: chatRoom.id };
  }

  /** GET /api/community/:communityId/chat/pinned */
  @Get('pinned')
  async getPinnedMessages(
    @Param('communityId') communityId: string,
    @CurrentUser() user: any,
  ) {
    const teacherId = user.sub ?? user.id;
    return this.chatService.getPinnedMessages(communityId, teacherId);
  }

  /** GET /api/community/:communityId/chat/unread */
  @Get('unread')
  async getUnreadCount(
    @Param('communityId') communityId: string,
    @CurrentUser() user: any,
  ): Promise<{ count: number }> {
    const teacherId = user.sub ?? user.id;
    return {
      count: await this.chatService.getUnreadCount(communityId, teacherId),
    };
  }

  /** GET /api/community/:communityId/chat/search?query=&limit=20 */
  @Get('search')
  async searchMessages(
    @Param('communityId') communityId: string,
    @CurrentUser() user: any,
    @Query('query') query: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const teacherId = user.sub ?? user.id;
    const chatRoom = await this.chatService.getOrCreateChatRoom(communityId);
    return this.chatService.searchMessages(
      chatRoom.id,
      communityId,
      teacherId,
      query ?? '',
      limit,
    );
  }

  /** POST /api/community/:communityId/chat/:messageId/react */
  @Post(':messageId/react')
  @UseGuards(SuspensionGuard)
  async addReaction(
    @Param('communityId') communityId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: any,
    @Body() dto: AddReactionDto,
  ) {
    const teacherId = user.sub ?? user.id;
    return this.chatService.addReaction(messageId, communityId, teacherId, dto);
  }

  /** DELETE /api/community/:communityId/chat/:messageId/react/:reaction */
  @Delete(':messageId/react/:reaction')
  @UseGuards(SuspensionGuard)
  async removeReaction(
    @Param('communityId') communityId: string,
    @Param('messageId') messageId: string,
    @Param('reaction') reaction: string,
    @CurrentUser() user: any,
  ) {
    const teacherId = user.sub ?? user.id;
    return this.chatService.removeReaction(
      messageId,
      communityId,
      teacherId,
      decodeURIComponent(reaction),
    );
  }

  /** PUT /api/community/:communityId/chat/:messageId */
  @Put(':messageId')
  @UseGuards(SuspensionGuard)
  async editMessage(
    @Param('communityId') communityId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: any,
    @Body() dto: EditMessageDto,
  ) {
    const teacherId = user.sub ?? user.id;
    return this.chatService.editMessage(messageId, communityId, teacherId, dto);
  }

  /** DELETE /api/community/:communityId/chat/:messageId */
  @Delete(':messageId')
  @UseGuards(SuspensionGuard)
  async deleteMessage(
    @Param('communityId') communityId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: any,
  ) {
    const teacherId = user.sub ?? user.id;
    return this.chatService.deleteMessage(messageId, communityId, teacherId);
  }

  /** POST /api/community/:communityId/chat/mark-read/bulk */
  @Post('mark-read/bulk')
  @UseGuards(SuspensionGuard)
  async markMessagesAsRead(
    @Param('communityId') communityId: string,
    @CurrentUser() user: any,
    @Body() body: { messageIds: string[] },
  ) {
    const teacherId = user.sub ?? user.id;
    return this.chatService.markMessagesAsRead(
      body.messageIds,
      communityId,
      teacherId,
    );
  }

  /** POST /api/community/:communityId/chat/:messageId/pin */
  @Post(':messageId/pin')
  @UseGuards(SuspensionGuard)
  async pinMessage(
    @Param('communityId') communityId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: any,
  ) {
    const teacherId = user.sub ?? user.id;
    return this.chatService.pinMessage(messageId, communityId, teacherId);
  }

  /** DELETE /api/community/:communityId/chat/:messageId/pin */
  @Delete(':messageId/pin')
  @UseGuards(SuspensionGuard)
  async unpinMessage(
    @Param('communityId') communityId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: any,
  ) {
    const teacherId = user.sub ?? user.id;
    return this.chatService.unpinMessage(messageId, communityId, teacherId);
  }
}

/**
 * Direct Messaging (1-to-1) Controller
 * Handles private conversations between two teachers
 */
@Controller('direct-messages')
@UseGuards(JwtAuthGuard)
export class DirectMessagesController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * POST /api/direct-messages/conversations
   * Find or create a direct conversation with another teacher
   */
  @Post('conversations')
  @UseGuards(SuspensionGuard)
  async createDirectConversation(
    @CurrentUser() user: any,
    @Body() dto: CreateDirectConversationDto,
  ) {
    const teacherId = user.sub ?? user.id;
    const result = await this.chatService.findOrCreateDirectConversation(
      teacherId,
      dto.targetTeacherId,
    );
    return result;
  }

  /**
   * GET /api/direct-messages/conversations
   * Get all direct conversations for the authenticated teacher
   */
  @Get('conversations')
  async getDirectConversations(@CurrentUser() user: any) {
    const teacherId = user.sub ?? user.id;
    const conversations =
      await this.chatService.getDirectConversations(teacherId);
    return { conversations };
  }

  /**
   * GET /api/direct-messages/conversations/:chatRoomId/messages
   * Get messages for a direct conversation with pagination
   */
  @Get('conversations/:chatRoomId/messages')
  async getDirectConversationMessages(
    @Param('chatRoomId') chatRoomId: string,
    @CurrentUser() user: any,
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  ) {
    const teacherId = user.sub ?? user.id;
    return this.chatService.getDirectConversationMessages(
      chatRoomId,
      teacherId,
      cursor,
      limit,
    );
  }

  /**
   * POST /api/direct-messages/conversations/:chatRoomId/messages
   * Send a message in a direct conversation
   */
  @Post('conversations/:chatRoomId/messages')
  @UseGuards(SuspensionGuard)
  async sendDirectMessage(
    @Param('chatRoomId') chatRoomId: string,
    @CurrentUser() user: any,
    @Body() dto: SendMessageDto,
  ) {
    const teacherId = user.sub ?? user.id;
    return this.chatService.sendDirectMessage(chatRoomId, teacherId, dto);
  }
}
