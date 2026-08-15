import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { type Response } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { VerifiedTeacherGuard } from 'src/auth/guards/verified-teacher.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { ChatAttachmentService } from './chat-attachment.service';
import { ChatService } from './chat.service';
import { multerConfig } from 'src/upload/config/multer.config';

@Controller('community/:communityId/chat')
@UseGuards(JwtAuthGuard, VerifiedTeacherGuard)
export class ChatAttachmentController {
  constructor(
    private readonly attachmentService: ChatAttachmentService,
    private readonly chatService: ChatService,
  ) {}

  /**
   * Upload attachment for a message
   * POST /community/:communityId/chat/upload
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadAttachment(
    @Param('communityId') communityId: string,
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string; type: string }> {
    // Verify community access
    await this.chatService.verifyAndGetCommunity(communityId, user.id);

    // Validate file
    this.attachmentService.validateFile(file);

    // File is already saved by Multer, just need to return the URL
    const url = `${file.destination}/${file.filename}`.replace(process.cwd(), '');
    const type = this.attachmentService.getAttachmentType(file.originalname);

    return {
      url,
      type,
    };
  }

  /**
   * Get shared media in chat room
   * GET /community/:communityId/chat/media?limit=50
   */
  @Get('media')
  async getSharedMedia(
    @Param('communityId') communityId: string,
    @CurrentUser() user: any,
    @Query('limit') limit: string = '50',
  ): Promise<any[]> {
    // Verify access
    await this.chatService.verifyAndGetCommunity(communityId, user.id);

    const chatRoom = await this.chatService.getOrCreateChatRoom(communityId);

    return this.attachmentService.getSharedMedia(chatRoom.id, parseInt(limit, 10));
  }

  /**
   * Get shared files in chat room
   * GET /community/:communityId/chat/files?limit=50
   */
  @Get('files')
  async getSharedFiles(
    @Param('communityId') communityId: string,
    @CurrentUser() user: any,
    @Query('limit') limit: string = '50',
  ): Promise<any[]> {
    // Verify access
    await this.chatService.verifyAndGetCommunity(communityId, user.id);

    const chatRoom = await this.chatService.getOrCreateChatRoom(communityId);

    return this.attachmentService.getSharedFiles(chatRoom.id, parseInt(limit, 10));
  }

  /**
   * Get attachment statistics for chat room
   * GET /community/:communityId/chat/attachments/stats
   */
  @Get('attachments/stats')
  async getAttachmentStats(
    @Param('communityId') communityId: string,
    @CurrentUser() user: any,
  ): Promise<any> {
    // Verify access
    await this.chatService.verifyAndGetCommunity(communityId, user.id);

    const chatRoom = await this.chatService.getOrCreateChatRoom(communityId);

    return this.attachmentService.getAttachmentStats(chatRoom.id);
  }

  /**
   * Download attachment file
   * GET /community/:communityId/chat/download?url=/uploads/...
   */
  @Get('download')
  async downloadAttachment(
    @Param('communityId') communityId: string,
    @CurrentUser() user: any,
    @Query('url') url: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!url) {
      throw new BadRequestException('URL parameter required');
    }

    // Verify access
    await this.chatService.verifyAndGetCommunity(communityId, user.id);

    // Get secure file path
    const filePath = this.attachmentService.getSecureFilePath(url);

    // Send file
    res.download(filePath);
  }
}
