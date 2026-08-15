import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiConsumes, ApiOperation } from "@nestjs/swagger";
import type { Response } from "express";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

import { CurrentUser } from "../auth/decorators/current-user.decorator";

import { TeacherService } from "./teacher.service";
import { VerificationService } from "./verification.service";
import { VerificationDocumentsDto } from "./dto/verification-documents.dto";
import {
  MAX_VERIFICATION_DOCUMENTS,
  verificationMulterConfig,
} from "./config/verification-multer.config";

@Controller("teacher")
export class TeacherController {
  constructor(
    private readonly teacherService: TeacherService,
    private readonly verificationService: VerificationService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  getProfile(@CurrentUser() user) {
    return this.teacherService.getProfile(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get("statistics")
  getStatistics(@CurrentUser() user) {
    return this.teacherService.getStatistics(user.sub);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "Get own verification status and documents" })
  @UseGuards(JwtAuthGuard)
  @Get("verification")
  getVerification(@CurrentUser() user) {
    return this.verificationService.getOwnVerification(user.sub);
  }

  @ApiBearerAuth()
  @ApiConsumes("multipart/form-data")
  @ApiOperation({
    summary: "Resubmit verification documents after a rejection",
  })
  @UseGuards(JwtAuthGuard)
  @Post("verification/resubmit")
  @UseInterceptors(
    FilesInterceptor(
      "documents",
      MAX_VERIFICATION_DOCUMENTS,
      verificationMulterConfig,
    ),
  )
  resubmitVerification(
    @CurrentUser() user,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: VerificationDocumentsDto,
  ) {
    return this.verificationService.resubmit(
      user.sub,
      files,
      dto.documentTypes,
    );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "Download one of your own verification documents" })
  @UseGuards(JwtAuthGuard)
  @Get("verification/documents/:documentId")
  async downloadOwnDocument(
    @CurrentUser() user,
    @Param("documentId") documentId: string,
    @Res() res: Response,
  ) {
    const document = await this.verificationService.getDocumentFile(
      user.sub,
      documentId,
    );

    res.type(document.mimeType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(document.fileName)}"`,
    );
    res.sendFile(document.filePath);
  }
}