import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { randomBytes } from 'crypto';

/**
 * Verification documents are private evidence, so they are stored OUTSIDE the
 * `uploads` directory that main.ts / ServeStaticModule expose publicly.
 * They are only readable through the authenticated verification endpoints.
 */
export const VERIFICATION_UPLOAD_DIR = join(
  process.cwd(),
  'private-uploads',
  'teacher-verification',
);

export const MAX_VERIFICATION_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_VERIFICATION_DOCUMENTS = 3;

export const ALLOWED_VERIFICATION_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

const ALLOWED_VERIFICATION_EXTENSIONS = [
  '.pdf',
  '.docx',
  '.jpg',
  '.jpeg',
  '.png',
];

export const verificationMulterConfig = {
  storage: diskStorage({
    destination: (req, file, callback) => {
      fs.mkdirSync(VERIFICATION_UPLOAD_DIR, { recursive: true });
      callback(null, VERIFICATION_UPLOAD_DIR);
    },

    filename: (req, file, callback) => {
      // Never reuse the client supplied name on disk — it may contain path
      // segments or a misleading extension.
      const extension = extname(file.originalname).toLowerCase();
      callback(
        null,
        `${Date.now()}-${randomBytes(16).toString('hex')}${extension}`,
      );
    },
  }),

  limits: {
    fileSize: MAX_VERIFICATION_FILE_SIZE,
    files: MAX_VERIFICATION_DOCUMENTS,
  },

  fileFilter: (req, file, callback) => {
    const extension = extname(file.originalname).toLowerCase();

    if (
      !ALLOWED_VERIFICATION_MIME_TYPES.includes(file.mimetype) ||
      !ALLOWED_VERIFICATION_EXTENSIONS.includes(extension)
    ) {
      callback(new BadRequestException('PDF, DOCX, JPG or PNG only.'), false);
      return;
    }

    callback(null, true);
  },
};
