import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadService {
  upload(file: Express.Multer.File) {
    // Use file.path (includes subdirectory, e.g. uploads/images/xxx.jpg)
    // rather than file.filename (just the bare filename with no subdirectory).
    const url = file.path
      .replace(/\\/g, '/')
      .replace(/^\.\//, '');

    return {
      fileName: file.originalname,
      path: file.path,
      url,
      size: file.size,
      type: file.mimetype,
    };
  }

  delete(filename: string) {
    return {
      message: `${filename} deleted`,
    };
  }
}
