import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateNotificationPreferenceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  soundEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  soundType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  browserNotifications?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  messages?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  communityActivity?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  questions?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  discussions?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  resources?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  levelProgress?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  announcements?: boolean;
}
