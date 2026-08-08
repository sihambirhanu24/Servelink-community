import { Injectable } from "@nestjs/common";

@Injectable()
export class UploadService {
  upload(file: Express.Multer.File) {
    return {
      fileName: file.originalname,

      path: file.path,

      url:
        "/uploads/" + file.filename,

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