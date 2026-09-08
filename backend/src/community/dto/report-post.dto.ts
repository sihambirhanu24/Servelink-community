import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReportReason } from '@prisma/client';

export class ReportPostDto {
  @ApiProperty({
    enum: ReportReason,
    example: ReportReason.SPAM,
    description: 'Reason for reporting the post',
  })
  @IsEnum(ReportReason, {
    message: 'reason must be a valid report reason (SPAM, ABUSE, HARASSMENT, MISINFORMATION, FAKE_INFORMATION, or OTHER)',
  })
  reason: ReportReason;

  @ApiProperty({
    example: 'This post contains spam links.',
    required: false,
    description: 'Optional additional details about the report',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'description must be at most 1000 characters' })
  description?: string;
}
