import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class ChatAttachmentService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');
  private readonly allowedExtensions = {
    image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    pdf: ['pdf'],
    docx: ['docx', 'doc'],
    video: ['mp4', 'webm', 'mov'],
  };
  private readonly maxFileSize = 50 * 1024 * 1024; // 50MB

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Validate file is safe for upload
   */
  validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(`File size exceeds 50MB limit`);
    }

    const ext = this.getFileExtension(file.originalname).toLowerCase();
    const allowedExts = Object.values(this.allowedExtensions).flat();

    if (!allowedExts.includes(ext)) {
      throw new BadRequestException(`File type .${ext} not allowed`);
    }

    // Validate MIME type matches extension
    if (!this.isValidMimeType(file.mimetype, ext)) {
      throw new BadRequestException('File MIME type does not match extension');
    }
  }

  /**
   * Check if MIME type is valid for extension
   */
  private isValidMimeType(mimeType: string, ext: string): boolean {
    const mimeMap: Record<string, string[]> = {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      pdf: ['application/pdf'],
      docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'],
      video: ['video/mp4', 'video/webm', 'video/quicktime'],
    };

    for (const [type, mimes] of Object.entries(mimeMap)) {
      if (this.allowedExtensions[type].includes(ext)) {
        return mimes.includes(mimeType);
      }
    }

    return false;
  }

  /**
   * Get file extension
   */
  private getFileExtension(filename: string): string {
    return filename.split('.').pop() || '';
  }

  /**
   * Get attachment type from extension
   */
  getAttachmentType(filename: string): 'IMAGE' | 'PDF' | 'DOCX' | 'VIDEO' {
    const ext = this.getFileExtension(filename).toLowerCase();

    if (this.allowedExtensions.image.includes(ext)) return 'IMAGE';
    if (this.allowedExtensions.pdf.includes(ext)) return 'PDF';
    if (this.allowedExtensions.docx.includes(ext)) return 'DOCX';
    if (this.allowedExtensions.video.includes(ext)) return 'VIDEO';

    return 'IMAGE'; // default
  }

  /**
   * Save attachment metadata to database
   */
  async saveAttachment(
    messageId: string,
    url: string,
    fileName: string,
    fileSize: number,
  ): Promise<any> {
    const type = this.getAttachmentType(fileName);

    return this.prisma.chatAttachment.create({
      data: {
        messageId,
        url,
        fileName,
        fileSize,
        type,
      },
    });
  }

  /**
   * Get all attachments in a message
   */
  async getMessageAttachments(messageId: string): Promise<any[]> {
    return this.prisma.chatAttachment.findMany({
      where: { messageId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get all shared media in a chat room
   */
  async getSharedMedia(chatRoomId: string, limit = 50): Promise<any[]> {
    return this.prisma.chatAttachment.findMany({
      where: {
        message: {
          chatRoomId,
          deletedAt: null,
        },
        type: 'IMAGE',
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get all shared files in a chat room
   */
  async getSharedFiles(chatRoomId: string, limit = 50): Promise<any[]> {
    return this.prisma.chatAttachment.findMany({
      where: {
        message: {
          chatRoomId,
          deletedAt: null,
        },
        type: {
          in: ['PDF', 'DOCX', 'VIDEO'],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Delete attachment file from disk
   */
  async deleteAttachmentFile(url: string): Promise<void> {
    try {
      // Extract relative path from URL (e.g., /uploads/images/file.jpg)
      const match = url.match(/\/uploads\/.+/);
      if (match) {
        const filePath = path.join(process.cwd(), match[0]);
        await fs.unlink(filePath);
      }
    } catch (error) {
      // Silently fail - file may have been deleted manually
      console.error(`Failed to delete attachment file: ${url}`, error);
    }
  }

  /**
   * Get file download path (secure)
   */
  getSecureFilePath(url: string): string {
    // Validate URL is safe (no path traversal)
    const normalizedPath = path.normalize(url);
    if (normalizedPath.includes('..')) {
      throw new BadRequestException('Invalid file path');
    }

    const filePath = path.join(process.cwd(), normalizedPath);

    // Ensure file exists and is within uploads directory
    if (!filePath.startsWith(this.uploadDir)) {
      throw new BadRequestException('File outside uploads directory');
    }

    return filePath;
  }

  /**
   * Calculate total attachment size for message
   */
  async getMessageAttachmentSize(messageId: string): Promise<number> {
    const result = await this.prisma.chatAttachment.aggregate({
      where: { messageId },
      _sum: { fileSize: true },
    });

    return result._sum.fileSize || 0;
  }

  /**
   * Get attachment statistics for chat room
   */
  async getAttachmentStats(chatRoomId: string): Promise<{
    totalAttachments: number;
    totalSize: number;
    byType: Record<string, number>;
  }> {
    const attachments = await this.prisma.chatAttachment.findMany({
      where: {
        message: {
          chatRoomId,
          deletedAt: null,
        },
      },
    });

    const byType: Record<string, number> = {
      IMAGE: 0,
      PDF: 0,
      DOCX: 0,
      VIDEO: 0,
    };

    let totalSize = 0;

    for (const att of attachments) {
      byType[att.type]++;
      totalSize += att.fileSize;
    }

    return {
      totalAttachments: attachments.length,
      totalSize,
      byType,
    };
  }
}
