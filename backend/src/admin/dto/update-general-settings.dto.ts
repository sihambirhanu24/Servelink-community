import { IsString, IsEmail, IsUrl, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateGeneralSettingsDto {
  @ApiProperty({ example: 'ServeLink', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  platformName?: string;

  @ApiProperty({ example: 'https://servelink.edu', required: false })
  @IsOptional()
  @IsUrl()
  platformUrl?: string;

  @ApiProperty({ example: 'support@servelink.edu', required: false })
  @IsOptional()
  @IsEmail()
  supportEmail?: string;

  @ApiProperty({ example: 'UTC', required: false })
  @IsOptional()
  @IsString()
  timezone?: string;
}
