import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Patch,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TeacherVerificationService } from './teacher-verification.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { VerificationSetupDto } from './dto/verification-setup.dto';
import { verificationMulterConfig } from './config/verification-multer.config';

/**
 * Teacher-facing verification endpoints
 * These endpoints allow teachers to:
 * - Upload verification documents
 * - Check their verification status
 * - Resubmit after rejection
 * - View and delete their documents
 */
@Controller('verification')
@UseGuards(JwtAuthGuard)
export class VerificationController {
  constructor(
    private readonly verificationService: TeacherVerificationService,
  ) {}

  /**
   * Upload a verification document
   * POST /verification/upload
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', verificationMulterConfig))
  async uploadDocument(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadDocumentDto,
  ) {
    const teacherId = req.user.teacherId || req.user.sub;

    const document = await this.verificationService.uploadDocument(
      teacherId,
      file,
      uploadDto.documentType,
    );

    return {
      success: true,
      message: 'Document uploaded successfully',
      document: {
        id: document.id,
        fileName: document.fileName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        uploadedAt: document.uploadedAt,
      },
    };
  }

  /**
   * Get verification status and documents
   * GET /verification/status
   */
  @Get('status')
  async getStatus(@Request() req) {
    const teacherId = req.user.teacherId || req.user.sub;
    return this.verificationService.getVerificationStatus(teacherId);
  }

  /**
   * Resubmit verification (for rejected teachers)
   * POST /verification/resubmit
   */
  @Post('resubmit')
  @HttpCode(HttpStatus.OK)
  async resubmit(@Request() req) {
    const teacherId = req.user.teacherId || req.user.sub;
    const result = await this.verificationService.resubmitVerification(teacherId);

    return {
      success: true,
      message: 'Verification resubmitted successfully. Please wait for admin review.',
      verificationStatus: result.verificationStatus,
    };
  }

  /**
   * Submit verification setup information (personal, professional, school info)
   * PATCH /verification/setup
   */
  @Patch('setup')
  @UseGuards(JwtAuthGuard)
  async setupVerification(@Request() req, @Body() setupDto: VerificationSetupDto) {
    const teacherId = req.user.teacherId || req.user.sub;
    const result = await this.verificationService.updateVerificationInfo(teacherId, setupDto);

    return {
      success: true,
      message: 'Verification information updated successfully.',
      teacher: result,
    };
  }

  /**
   * View a specific verification document (teacher can view their own documents)
   * GET /verification/documents/:documentId
   */
  @Get('documents/:documentId')
  async viewDocument(
    @Request() req,
    @Param('documentId') documentId: string,
    @Res() res: Response,
  ) {
    const teacherId = req.user.teacherId || req.user.sub;
    const isAdmin = req.user.isAdmin || false;

    const { document, filePath } = await this.verificationService.getDocument(
      documentId,
      teacherId,
      isAdmin,
    );

    // Send file as download (do NOT serve via public URL)
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);
    res.sendFile(filePath, { root: '.' });
  }

  /**
   * Delete a verification document
   * DELETE /verification/documents/:documentId
   */
  @Delete('documents/:documentId')
  async deleteDocument(@Request() req, @Param('documentId') documentId: string) {
    const teacherId = req.user.teacherId || req.user.sub;
    return this.verificationService.deleteDocument(documentId, teacherId);
  }
}
