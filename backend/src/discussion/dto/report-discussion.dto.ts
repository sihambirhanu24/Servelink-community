import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { ReportReason } from '@prisma/client';

export class ReportDiscussionDto {
  @IsEnum(ReportReason)
  @IsNotEmpty()
  reason: ReportReason;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
