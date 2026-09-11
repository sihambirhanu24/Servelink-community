import { IsBoolean, IsInt, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateSecuritySettingsDto {
  @ApiProperty({ example: 30, required: false, description: 'Session timeout in minutes' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(240)
  sessionTimeout?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  strongPasswordRequired?: boolean;

  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(3)
  @Max(10)
  maxLoginAttempts?: number;
}
