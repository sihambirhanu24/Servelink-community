import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum CommunityTypeDto {
  SCHOOL   = 'SCHOOL',
  WOREDA   = 'WOREDA',
  ZONE     = 'ZONE',
  REGION   = 'REGION',
  NATIONAL = 'NATIONAL',
}

export enum CommunitySubtypeDto {
  COMMON     = 'COMMON',
  DEPARTMENT = 'DEPARTMENT',
}

export class CreateCommunityDto {
  @ApiProperty({ example: 'Adama Mathematics Community' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({ enum: CommunityTypeDto })
  @IsEnum(CommunityTypeDto)
  type: CommunityTypeDto;

  @ApiProperty({
    enum: CommunitySubtypeDto,
    default: CommunitySubtypeDto.COMMON,
    required: false,
    description:
      'COMMON = all teachers at this scope. DEPARTMENT = restricted to one department.',
  })
  @IsOptional()
  @IsEnum(CommunitySubtypeDto)
  subtype?: CommunitySubtypeDto;

  @ApiProperty({ example: 'Mathematics', required: false })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({ example: 'Adama Secondary School', required: false })
  @IsOptional()
  @IsString()
  school?: string;

  @ApiProperty({ example: 'Adama', required: false })
  @IsOptional()
  @IsString()
  woreda?: string;

  @ApiProperty({ example: 'East Shewa', required: false })
  @IsOptional()
  @IsString()
  zone?: string;

  @ApiProperty({ example: 'Oromia', required: false })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateCommunityDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
