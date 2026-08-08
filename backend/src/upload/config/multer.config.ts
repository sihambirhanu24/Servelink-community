import {
  BadRequestException,
} from '@nestjs/common';

import { diskStorage } from 'multer';

import { extname } from 'path';

export const multerConfig = {
  storage: diskStorage({
    destination: (
      req,
      file,
      callback,
    ) => {
      let destination = './uploads/images';

      if (
        req.originalUrl.includes(
          'profile',
        )
      ) {
        destination =
          './uploads/avatars';
      }

      
      else if (
        file.mimetype.startsWith(
          'image/',
        )
      ) {
        destination =
          './uploads/images';
      }

      else if (
        file.mimetype ===
        'application/pdf'
      ) {
        destination =
          './uploads/pdfs';
      }

      else if (
        file.originalname
          .toLowerCase()
          .endsWith('.docx')
      ) {
        destination =
          './uploads/docs';
      }

      else if (
        file.mimetype.startsWith('video/')
      ) {
        destination =
          './uploads/videos';
      }

      callback(
        null,
        destination,
      );
    },

    filename: (
      req,
      file,
      callback,
    ) => {
      const uniqueName =
        Date.now() +
        '-' +
        Math.round(
          Math.random() * 1e9,
        );

      callback(
        null,
        uniqueName +
          extname(
            file.originalname,
          ),
      );
    },
  }),

  limits: {
    fileSize:
      5 * 1024 * 1024,
  },

  fileFilter: (
    req,
    file,
    callback,
  ) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ];

    if (
      allowedTypes.includes(
        file.mimetype,
      )
    ) {
      callback(null, true);
    } else {
      callback(
        new BadRequestException(
          'Only images, PDF, DOCX, MP4, WebM and MOV files are allowed.',
        ),
        false,
      );
    }
  },
};