import { TeacherVerificationStatus, VerificationDocumentType } from '@prisma/client';

export interface VerificationDocument {
  id: string;
  teacherId: string;
  fileName: string;
  filePath: string;
  fileType: VerificationDocumentType;
  mimeType: string;
  fileSize: number;
  uploadedAt: Date;
}

export interface TeacherVerificationInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  school: string;
  woreda: string;
  zone: string;
  region: string;
  department: string | null;
  subject: string | null;
  verificationStatus: TeacherVerificationStatus;
  rejectionReason: string | null;
  approvedAt: Date | null;
  approvedBy: string | null;
  createdAt: Date;
  documents: VerificationDocument[];
}

export interface VerificationStatusResponse {
  verificationStatus: TeacherVerificationStatus;
  rejectionReason: string | null;
  approvedAt: Date | null;
  documents: VerificationDocument[];
}

/**
 * Maximum file size for verification documents (5MB)
 */
export const MAX_VERIFICATION_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Allowed MIME types for verification documents
 */
export const ALLOWED_VERIFICATION_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  'image/jpeg',
  'image/jpg',
  'image/png',
];

/**
 * Allowed file extensions for verification documents
 */
export const ALLOWED_VERIFICATION_EXTENSIONS = ['.pdf', '.docx', '.jpg', '.jpeg', '.png'];
