import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsOptional } from 'class-validator';
import { TeacherVerificationDocumentType } from '@prisma/client';

/**
 * Document types are sent alongside the files in the same multipart request,
 * positionally matching the uploaded `documents` files. Multipart sends a
 * single value as a string and repeated values as an array, so both are
 * normalised to an array here.
 */
export class VerificationDocumentsDto {
  @ApiPropertyOptional({
    isArray: true,
    enum: TeacherVerificationDocumentType,
    description: 'Type of each uploaded document, in upload order',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null
      ? undefined
      : (Array.isArray(value) ? value : String(value).split(','))
          .map((entry: string) => entry.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsEnum(TeacherVerificationDocumentType, { each: true })
  documentTypes?: TeacherVerificationDocumentType[];
}
