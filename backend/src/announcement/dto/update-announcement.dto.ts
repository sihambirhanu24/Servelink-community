import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ANNOUNCEMENT_TYPES, ANNOUNCEMENT_TARGETS } from './create-announcement.dto';

export class UpdateAnnouncementDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  title?: string;

  @IsString()
  @IsOptional()
  @MinLength(10)
  @Transform(({ value }) => value?.trim())
  content?: string;

  @IsIn(ANNOUNCEMENT_TYPES)
  @IsOptional()
  type?: string;

  @IsIn(ANNOUNCEMENT_TARGETS)
  @IsOptional()
  targetAudience?: string;

  @IsString()
  @IsOptional()
  communityId?: string;
}
