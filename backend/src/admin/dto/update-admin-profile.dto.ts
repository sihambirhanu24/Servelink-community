import { IsString, IsEmail, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAdminProfileDto {
  @ApiProperty({ description: 'Admin name', example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiProperty({ description: 'Admin email', example: 'admin@servelink.com' })
  @IsOptional()
  @IsEmail()
  email?: string;
}
