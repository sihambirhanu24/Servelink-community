import { IsEnum, IsNotEmpty } from 'class-validator';
import { VerificationDocumentType } from '@prisma/client';

export class UploadDocumentDto {
  @IsEnum(VerificationDocumentType)
  @IsNotEmpty()
  documentType: VerificationDocumentType;
}
