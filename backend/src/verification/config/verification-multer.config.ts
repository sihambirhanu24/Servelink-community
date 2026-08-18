import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import {
  MAX_VERIFICATION_FILE_SIZE,
  ALLOWED_VERIFICATION_MIME_TYPES,
} from '../types/verification.types';

/**
 * Multer configuration specifically for teacher verification documents
 */
export const verificationMulterConfig = {
  storage: diskStorage({
    destination: (req, file, callback) => {
      // Store verification documents in a secure directory
      // These documents contain sensitive information and should NOT be publicly accessible
      callback(null, './uploads/verification-documents');
    },
    filename: (req, file, callback) => {
      // Generate unique filename: timestamp-random-original
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      callback(null, `verification-${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: MAX_VERIFICATION_FILE_SIZE, // 5MB
  },
  fileFilter: (req, file, callback) => {
    if (ALLOWED_VERIFICATION_MIME_TYPES.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        new BadRequestException(
          'Invalid file type. Only PDF, DOCX, JPG, and PNG files are allowed for verification documents.',
        ),
        false,
      );
    }
  },
};
