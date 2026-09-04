import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { ChatAttachmentService } from './chat-attachment.service';
import { ChatService } from './chat.service';
import { multerConfig } from 'src/upload/config/multer.config';

@Controller('direct-messages')
@UseGuards(JwtAuthGuard)
export class DirectMessageAttachmentController {
  constructor(
    private readonly attachmentService: ChatAttachmentService,
    private readonly chatService: ChatService,
  ) {}

  /**
   * Upload attachment for a direct message
   * POST /direct-messages/upload
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadAttachment(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string; type: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file
    this.attachmentService.validateFile(file);

    // File is already saved by Multer, just need to return the URL
    const url = `${file.destination}/${file.filename}`.replace(
      process.cwd(),
      '',
    );
    const type = this.attachmentService.getAttachmentType(file.originalname);

    return {
      url,
      type,
    };
  }
}
