import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationEvent } from '../notification/notification.types';
import {
  TeacherVerificationStatus,
  VerificationDocumentType,
} from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';
import {
  ALLOWED_VERIFICATION_MIME_TYPES,
  MAX_VERIFICATION_FILE_SIZE,
  TeacherVerificationInfo,
  VerificationStatusResponse,
} from './types/verification.types';

@Injectable()
export class TeacherVerificationService {
  private readonly logger = new Logger(TeacherVerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Upload a verification document for a teacher
   */
  async uploadDocument(
    teacherId: string,
    file: Express.Multer.File,
    documentType: VerificationDocumentType,
  ) {
    // Validate file
    this.validateFile(file);

    // Create document record
    const document = await this.prisma.teacherVerificationDocument.create({
      data: {
        teacherId,
        fileName: file.originalname,
        filePath: file.path.replace(/\\/g, '/'),
        fileType: documentType,
        mimeType: file.mimetype,
        fileSize: file.size,
      },
    });

    this.logger.log(
      `Teacher ${teacherId} uploaded ${documentType} document: ${file.originalname}`,
    );

    return document;
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Check file size
    if (file.size > MAX_VERIFICATION_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${MAX_VERIFICATION_FILE_SIZE / (1024 * 1024)}MB`,
      );
    }

    // Check MIME type
    if (!ALLOWED_VERIFICATION_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only PDF, DOCX, JPG, and PNG files are allowed.',
      );
    }
  }

  /**
   * Get verification status and documents for a teacher
   */
  async getVerificationStatus(teacherId: string): Promise<VerificationStatusResponse> {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: {
        verificationStatus: true,
        rejectionReason: true,
        approvedAt: true,
        verificationDocuments: {
          select: {
            id: true,
            teacherId: true,
            fileName: true,
            filePath: true,
            fileType: true,
            mimeType: true,
            fileSize: true,
            uploadedAt: true,
          },
          orderBy: {
            uploadedAt: 'desc',
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return {
      verificationStatus: teacher.verificationStatus,
      rejectionReason: teacher.rejectionReason,
      approvedAt: teacher.approvedAt,
      documents: teacher.verificationDocuments,
    };
  }

  /**
   * Get all pending teachers for admin review
   */
  async getPendingTeachers() {
    return this.prisma.teacher.findMany({
      where: {
        verificationStatus: TeacherVerificationStatus.PENDING,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        school: true,
        woreda: true,
        zone: true,
        region: true,
        department: true,
        subject: true,
        createdAt: true,
        verificationDocuments: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            uploadedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * Get detailed verification info for a teacher (admin view)
   */
  async getTeacherVerificationInfo(teacherId: string): Promise<TeacherVerificationInfo> {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        school: true,
        woreda: true,
        zone: true,
        region: true,
        department: true,
        subject: true,
        verificationStatus: true,
        rejectionReason: true,
        approvedAt: true,
        approvedBy: true,
        createdAt: true,
        verificationDocuments: {
          select: {
            id: true,
            teacherId: true,
            fileName: true,
            filePath: true,
            fileType: true,
            mimeType: true,
            fileSize: true,
            uploadedAt: true,
          },
          orderBy: {
            uploadedAt: 'desc',
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return {
      ...teacher,
      documents: teacher.verificationDocuments,
    };
  }

  /**
   * Approve a teacher's verification (admin only)
   */
  async approveTeacher(teacherId: string, adminId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        verificationStatus: true,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    if (teacher.verificationStatus === TeacherVerificationStatus.APPROVED) {
      throw new BadRequestException('Teacher is already approved');
    }

    // Update teacher verification status
    const updated = await this.prisma.teacher.update({
      where: { id: teacherId },
      data: {
        verificationStatus: TeacherVerificationStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy: adminId,
        rejectionReason: null, // Clear any previous rejection reason
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        verificationStatus: true,
        approvedAt: true,
      },
    });

    // Send notification to teacher
    this.notificationService
      .create({
        receiverId: teacherId,
        title: 'Verification Approved! 🎉',
        message: `Congratulations ${teacher.firstName}! Your teacher verification has been approved. You now have full access to ServeLink Community.`,
        type: NotificationEvent.SYSTEM,
      })
      .catch((err) => this.logger.error(`Failed to send approval notification: ${err.message}`));

    this.logger.log(`Teacher ${teacherId} approved by admin ${adminId}`);

    return updated;
  }

  /**
   * Reject a teacher's verification with reason (admin only)
   */
  async rejectTeacher(teacherId: string, reason: string, adminId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        verificationStatus: true,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    if (teacher.verificationStatus === TeacherVerificationStatus.APPROVED) {
      throw new BadRequestException(
        'Cannot reject an already approved teacher through this endpoint',
      );
    }

    // Update teacher verification status
    const updated = await this.prisma.teacher.update({
      where: { id: teacherId },
      data: {
        verificationStatus: TeacherVerificationStatus.REJECTED,
        rejectionReason: reason,
        approvedAt: null,
        approvedBy: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        verificationStatus: true,
        rejectionReason: true,
      },
    });

    // Send notification to teacher
    this.notificationService
      .create({
        receiverId: teacherId,
        title: 'Verification Rejected',
        message: `Your teacher verification was rejected. Reason: ${reason}. Please update your documents and resubmit.`,
        type: NotificationEvent.SYSTEM,
      })
      .catch((err) => this.logger.error(`Failed to send rejection notification: ${err.message}`));

    this.logger.log(`Teacher ${teacherId} rejected by admin ${adminId}: ${reason}`);

    return updated;
  }

  /**
   * Resubmit verification (for rejected teachers)
   * This resets status to PENDING after uploading new documents
   */
  async resubmitVerification(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: {
        verificationStatus: true,
        verificationDocuments: true,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    if (teacher.verificationStatus !== TeacherVerificationStatus.REJECTED) {
      throw new BadRequestException('Only rejected teachers can resubmit verification');
    }

    if (teacher.verificationDocuments.length === 0) {
      throw new BadRequestException('Please upload verification documents before resubmitting');
    }

    // Reset to PENDING status
    const updated = await this.prisma.teacher.update({
      where: { id: teacherId },
      data: {
        verificationStatus: TeacherVerificationStatus.PENDING,
        rejectionReason: null,
      },
      select: {
        id: true,
        verificationStatus: true,
      },
    });

    this.logger.log(`Teacher ${teacherId} resubmitted verification`);

    return updated;
  }

  /**
   * Get a specific verification document (for authorized viewing)
   */
  async getDocument(documentId: string, requesterId: string, isAdmin: boolean) {
    const document = await this.prisma.teacherVerificationDocument.findUnique({
      where: { id: documentId },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Authorization check: only the teacher themselves or an admin can view
    if (!isAdmin && document.teacherId !== requesterId) {
      throw new ForbiddenException('You do not have permission to view this document');
    }

    // Check if file exists
    if (!fs.existsSync(document.filePath)) {
      throw new NotFoundException('Document file not found on server');
    }

    return {
      document,
      filePath: document.filePath,
    };
  }

  /**
   * Delete a verification document
   */
  async deleteDocument(documentId: string, teacherId: string) {
    const document = await this.prisma.teacherVerificationDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.teacherId !== teacherId) {
      throw new ForbiddenException('You can only delete your own documents');
    }

    // Check if teacher is approved - prevent deletion of approved documents
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { verificationStatus: true },
    });

    if (teacher?.verificationStatus === TeacherVerificationStatus.APPROVED) {
      throw new BadRequestException('Cannot delete documents from approved verification');
    }

    // Delete from database
    await this.prisma.teacherVerificationDocument.delete({
      where: { id: documentId },
    });

    // Delete file from disk
    try {
      if (fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath);
      }
    } catch (error) {
      this.logger.error(`Failed to delete file ${document.filePath}: ${error.message}`);
    }

    this.logger.log(`Teacher ${teacherId} deleted document ${documentId}`);

    return { success: true, message: 'Document deleted successfully' };
  }

  /**
   * Check if teacher is verified (for use in guards)
   */
  async isTeacherVerified(teacherId: string): Promise<boolean> {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { verificationStatus: true },
    });

    return teacher?.verificationStatus === TeacherVerificationStatus.APPROVED;
  }
}
