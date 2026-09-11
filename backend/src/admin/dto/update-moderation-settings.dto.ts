import { IsBoolean, IsString, IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateModerationSettingsDto {
  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  autoFlagSpam?: boolean;

  @ApiProperty({ example: 'medium', required: false, enum: ['low', 'medium', 'high'] })
  @IsOptional()
  @IsString()
  @IsIn(['low', 'medium', 'high'])
  spamThreshold?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  profanityFilter?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  requirePostApproval?: boolean;
}
