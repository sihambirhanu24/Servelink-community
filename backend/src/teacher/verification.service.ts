import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  TeacherVerificationAction,
  TeacherVerificationDocumentType,
  TeacherVerificationStatus,
} from '@prisma/client';
import * as fs from 'fs';

import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationEvent } from '../notification/notification.types';
import {
  ALLOWED_VERIFICATION_MIME_TYPES,
  MAX_VERIFICATION_DOCUMENTS,
  MAX_VERIFICATION_FILE_SIZE,
} from './config/verification-multer.config';

const TEACHER_VERIFICATION_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  school: true,
  department: true,
  subject: true,
  woreda: true,
  zone: true,
  region: true,
  teacherIdNumber: true,
  level: true,
  status: true,
  verified: true,
  verificationStatus: true,
  rejectionReason: true,
  approvedAt: true,
  approvedBy: true,
  createdAt: true,
} satisfies Prisma.TeacherSelect;

const DOCUMENT_SELECT = {
  id: true,
  documentType: true,
  fileName: true,
  mimeType: true,
  fileSize: true,
  uploadedAt: true,
  archivedAt: true,
} satisfies Prisma.TeacherVerificationDocumentSelect;

/**
 * Magic bytes for the formats we accept. The MIME type reported by the client
 * is attacker-controlled, so the stored bytes are sniffed as well.
 * DOCX is a ZIP container, hence the "PK" signature.
 */
const MAGIC_BYTES: Record<string, number[][]> = {
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    [0x50, 0x4b, 0x03, 0x04],
    [0x50, 0x4b, 0x05, 0x06],
    [0x50, 0x4b, 0x07, 0x08],
  ],
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/jpg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47]],
};

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Stores the uploaded files as the teacher's current verification evidence.
   * `action` distinguishes the first submission from a resubmission after a
   * rejection; both leave the teacher in PENDING.
   */
  async submitDocuments(
    teacherId: string,
    files: Express.Multer.File[],
    documentTypes: TeacherVerificationDocumentType[] | undefined,
    action: TeacherVerificationAction,
  ) {
    this.validateFiles(files);

    await this.prisma.$transaction([
      // Keep the previous submission for auditability instead of deleting it.
      this.prisma.teacherVerificationDocument.updateMany({
        where: { teacherId, archivedAt: null },
        data: { archivedAt: new Date() },
      }),
      this.prisma.teacherVerificationDocument.createMany({
        data: files.map((file, index) => ({
          teacherId,
          documentType:
            documentTypes?.[index] ?? TeacherVerificationDocumentType.OTHER,
          fileName: file.originalname,
          filePath: file.path,
          mimeType: file.mimetype,
          fileSize: file.size,
        })),
      }),
      this.prisma.teacherVerificationEvent.create({
        data: { teacherId, action },
      }),
    ]);
  }

  /** Files that failed validation are removed from disk before throwing. */
  private validateFiles(files: Express.Multer.File[]) {
    const discard = () => {
      for (const file of files ?? []) {
        fs.promises.unlink(file.path).catch(() => {});
      }
    };

    if (!files?.length) {
      throw new BadRequestException(
        'Please upload at least one verification document.',
      );
    }

    if (files.length > MAX_VERIFICATION_DOCUMENTS) {
      discard();
      throw new BadRequestException(
        `You can upload at most ${MAX_VERIFICATION_DOCUMENTS} verification documents.`,
      );
    }

    for (const file of files) {
      if (!ALLOWED_VERIFICATION_MIME_TYPES.includes(file.mimetype)) {
        discard();
        throw new BadRequestException('PDF, DOCX, JPG or PNG only.');
      }

      if (file.size > MAX_VERIFICATION_FILE_SIZE) {
        discard();
        throw new BadRequestException('Maximum file size is 5 MB.');
      }

      if (!this.hasExpectedMagicBytes(file)) {
        discard();
        throw new BadRequestException(
          `${file.originalname} does not match its declared file type.`,
        );
      }
    }
  }

  private hasExpectedMagicBytes(file: Express.Multer.File) {
    const signatures = MAGIC_BYTES[file.mimetype];
    if (!signatures) return false;

    const handle = fs.openSync(file.path, 'r');
    const header = Buffer.alloc(8);
    try {
      fs.readSync(handle, header, 0, header.length, 0);
    } finally {
      fs.closeSync(handle);
    }

    return signatures.some((signature) =>
      signature.every((byte, index) => header[index] === byte),
    );
  }

  /** Verification state for the authenticated teacher's own profile. */
  async getOwnVerification(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: {
        ...TEACHER_VERIFICATION_SELECT,
        verificationDocuments: {
          where: { archivedAt: null },
          select: DOCUMENT_SELECT,
          orderBy: { uploadedAt: 'asc' },
        },
      },
    });

    if (!teacher) throw new NotFoundException('Teacher not found');

    return teacher;
  }

  async resubmit(
    teacherId: string,
    files: Express.Multer.File[],
    documentTypes: TeacherVerificationDocumentType[] | undefined,
  ) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { id: true, verificationStatus: true },
    });

    if (!teacher) throw new NotFoundException('Teacher not found');

    // Only REJECTED -> PENDING is a valid teacher-initiated transition.
    if (teacher.verificationStatus !== TeacherVerificationStatus.REJECTED) {
      for (const file of files ?? []) {
        fs.promises.unlink(file.path).catch(() => {});
      }
      throw new ForbiddenException(
        teacher.verificationStatus === TeacherVerificationStatus.APPROVED
          ? 'Your account is already verified.'
          : 'Your verification is still under review.',
      );
    }

    await this.submitDocuments(
      teacherId,
      files,
      documentTypes,
      TeacherVerificationAction.RESUBMITTED,
    );

    await this.prisma.teacher.update({
      where: { id: teacherId },
      data: {
        verificationStatus: TeacherVerificationStatus.PENDING,
        rejectionReason: null,
      },
    });

    return this.getOwnVerification(teacherId);
  }

  async getPendingTeachers(query: {
    page?: number;
    pageSize?: number;
    search?: string;
  }) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.TeacherWhereInput = {
      verificationStatus: TeacherVerificationStatus.PENDING,
    };

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { school: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [teachers, total] = await Promise.all([
      this.prisma.teacher.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'asc' },
        select: {
          ...TEACHER_VERIFICATION_SELECT,
          verificationDocuments: {
            where: { archivedAt: null },
            select: DOCUMENT_SELECT,
            orderBy: { uploadedAt: 'asc' },
          },
        },
      }),
      this.prisma.teacher.count({ where }),
    ]);

    return { data: teachers, meta: { total, page, pageSize } };
  }

  /** Full verification record incl. document metadata and audit history. */
  async getTeacherVerification(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: {
        ...TEACHER_VERIFICATION_SELECT,
        verificationDocuments: {
          select: DOCUMENT_SELECT,
          orderBy: { uploadedAt: 'desc' },
        },
        verificationEvents: {
          select: {
            id: true,
            action: true,
            actorAdminId: true,
            reason: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!teacher) throw new NotFoundException('Teacher not found');

    return teacher;
  }

  /**
   * Resolves a document for streaming. The document must belong to
   * `teacherId`, so an admin (or teacher) cannot read another teacher's
   * evidence by guessing document ids.
   */
  async getDocumentFile(teacherId: string, documentId: string) {
    const document = await this.prisma.teacherVerificationDocument.findFirst({
      where: { id: documentId, teacherId },
    });

    if (!document)
      throw new NotFoundException('Verification document not found');

    if (!fs.existsSync(document.filePath)) {
      throw new NotFoundException('Verification document file is missing');
    }

    return document;
  }

  async approve(teacherId: string, adminId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { id: true, firstName: true, verificationStatus: true },
    });

    if (!teacher) throw new NotFoundException('Teacher not found');

    if (teacher.verificationStatus === TeacherVerificationStatus.APPROVED) {
      throw new BadRequestException('Teacher is already approved');
    }

    const updated = await this.prisma.teacher.update({
      where: { id: teacherId },
      data: {
        verificationStatus: TeacherVerificationStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy: adminId,
        rejectionReason: null,
        // Keep the pre-existing `verified` flag in sync for the UI that reads it.
        verified: true,
      },
      select: TEACHER_VERIFICATION_SELECT,
    });

    await this.prisma.teacherVerificationEvent.create({
      data: {
        teacherId,
        action: TeacherVerificationAction.APPROVED,
        actorAdminId: adminId,
      },
    });

    await this.notificationService
      .create({
        receiverId: teacherId,
        title: 'Verification approved',
        message: `Congratulations ${teacher.firstName}! Your teacher account has been verified.`,
        type: NotificationEvent.SYSTEM,
      })
      .catch(() => {});

    return updated;
  }

  async reject(teacherId: string, adminId: string, reason: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { id: true, verificationStatus: true },
    });

    if (!teacher) throw new NotFoundException('Teacher not found');

    if (teacher.verificationStatus !== TeacherVerificationStatus.PENDING) {
      throw new BadRequestException(
        'Only a teacher awaiting review can be rejected',
      );
    }

    const updated = await this.prisma.teacher.update({
      where: { id: teacherId },
      data: {
        verificationStatus: TeacherVerificationStatus.REJECTED,
        rejectionReason: reason,
        approvedAt: null,
        approvedBy: null,
        verified: false,
      },
      select: TEACHER_VERIFICATION_SELECT,
    });

    await this.prisma.teacherVerificationEvent.create({
      data: {
        teacherId,
        action: TeacherVerificationAction.REJECTED,
        actorAdminId: adminId,
        reason,
      },
    });

    await this.notificationService
      .create({
        receiverId: teacherId,
        title: 'Verification rejected',
        message: `Your verification was rejected: ${reason}`,
        type: NotificationEvent.SYSTEM,
      })
      .catch(() => {});

    return updated;
  }

  async isApproved(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { verificationStatus: true },
    });

    return teacher?.verificationStatus === TeacherVerificationStatus.APPROVED;
  }
}
