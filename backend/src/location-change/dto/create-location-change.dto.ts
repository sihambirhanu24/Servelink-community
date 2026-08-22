import { IsString, IsNotEmpty, MaxLength, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLocationChangeDto {
  @ApiPropertyOptional({ description: 'The requested school' })
  @IsString()
  @IsOptional()
  requestedSchool?: string;

  @ApiPropertyOptional({ description: 'The requested woreda' })
  @IsString()
  @IsOptional()
  requestedWoreda?: string;

  @ApiPropertyOptional({ description: 'The requested zone' })
  @IsString()
  @IsOptional()
  requestedZone?: string;

  @ApiPropertyOptional({ description: 'The requested region' })
  @IsString()
  @IsOptional()
  requestedRegion?: string;

  @ApiPropertyOptional({ description: 'The requested subject' })
  @IsString()
  @IsOptional()
  requestedSubject?: string;

  @ApiProperty({ description: 'Reason for location change' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  reason: string;
}
