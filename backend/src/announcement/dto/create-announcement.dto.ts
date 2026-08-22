import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export const ANNOUNCEMENT_TYPES = ['GENERAL', 'IMPORTANT', 'URGENT', 'COMMUNITY_UPDATE', 'SYSTEM_UPDATE'] as const;
export const ANNOUNCEMENT_TARGETS = ['ALL_TEACHERS', 'SCHOOL', 'WOREDA', 'ZONE', 'REGION', 'NATIONAL'] as const;

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @Transform(({ value }) => value?.trim())
  content: string;

  @IsIn(ANNOUNCEMENT_TYPES)
  @IsOptional()
  @Transform(({ value }) => value || 'GENERAL')
  type?: string;

  @IsIn(ANNOUNCEMENT_TARGETS)
  @IsOptional()
  @Transform(({ value }) => value || 'ALL_TEACHERS')
  targetAudience?: string;

  @IsString()
  @IsOptional()
  communityId?: string;
}
