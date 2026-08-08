import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReportReason } from '@prisma/client';

export class ReportPostDto {
  @ApiProperty({
    enum: ReportReason,
    example: ReportReason.SPAM,
  })
  @IsEnum(ReportReason)
  reason: ReportReason;

  @ApiProperty({
    example: 'This post contains spam links.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}