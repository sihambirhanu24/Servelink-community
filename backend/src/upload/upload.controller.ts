import {
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";

import { FileInterceptor } from "@nestjs/platform-express";

import { UploadService } from "./upload.service";

import { multerConfig } from "./config/multer.config";

@Controller("upload")
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor("file", multerConfig),
  )
  upload(
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.uploadService.upload(file);
  }

  @Delete(":filename")
  remove(
    @Param("filename")
    filename: string,
  ) {
    return this.uploadService.delete(filename);
  }
  
}