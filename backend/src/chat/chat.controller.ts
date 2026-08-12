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
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import { ChatMessageResponseDto } from './dto/chat-message-response.dto';
import { AddReactionDto } from './dto/add-reaction.dto';
import { EditMessageDto } from './dto/edit-message.dto';

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
    return { groups: await this.chatService.getAccessibleChatGroups(teacherId) };
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
  ): Promise<{ messages: ChatMessageResponseDto[]; total: number; page: number; limit: number }> {
    const teacherId = user.sub ?? user.id;
    await this.chatService.verifyAndGetCommunity(communityId, teacherId);
    const chatRoom = await this.chatService.getOrCreateChatRoom(communityId);
    const offset = (page - 1) * limit;
    const { messages, total } = await this.chatService.getMessageHistory(chatRoom.id, limit, offset);
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
    const community = await this.chatService.verifyAndGetCommunity(communityId, teacherId);
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
    return { count: await this.chatService.getUnreadCount(communityId, teacherId) };
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
    return this.chatService.searchMessages(chatRoom.id, communityId, teacherId, query ?? '', limit);
  }

  /** POST /api/community/:communityId/chat/:messageId/react */
  @Post(':messageId/react')
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
  async removeReaction(
    @Param('communityId') communityId: string,
    @Param('messageId') messageId: string,
    @Param('reaction') reaction: string,
    @CurrentUser() user: any,
  ) {
    const teacherId = user.sub ?? user.id;
    return this.chatService.removeReaction(messageId, communityId, teacherId, decodeURIComponent(reaction));
  }

  /** PUT /api/community/:communityId/chat/:messageId */
  @Put(':messageId')
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
  async markMessagesAsRead(
    @Param('communityId') communityId: string,
    @CurrentUser() user: any,
    @Body() body: { messageIds: string[] },
  ) {
    const teacherId = user.sub ?? user.id;
    return this.chatService.markMessagesAsRead(body.messageIds, communityId, teacherId);
  }

  /** POST /api/community/:communityId/chat/:messageId/pin */
  @Post(':messageId/pin')
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
  async unpinMessage(
    @Param('communityId') communityId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: any,
  ) {
    const teacherId = user.sub ?? user.id;
    return this.chatService.unpinMessage(messageId, communityId, teacherId);
  }
}
