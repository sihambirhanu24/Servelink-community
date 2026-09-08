import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsEnum,
  IsBoolean,
  IsInt,
  IsOptional,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
  MinLength,
  MaxLength,
} from 'class-validator';

export enum SupportTypeDto {
  CHAT = 'CHAT',
  LIVE_SESSION = 'LIVE_SESSION',
  RESOURCE = 'RESOURCE',
  MENTORSHIP = 'MENTORSHIP',
}

export class CreateProviderProfileDto {
  @ApiProperty({
    description: 'Areas of expertise (e.g., React, Mathematics, Classroom Management)',
    example: ['React', 'Next.js', 'TypeScript'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  expertise: string[];

  @ApiProperty({
    description: 'Years of experience or brief description',
    example: '5 years teaching web development',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  experience: string;

  @ApiProperty({
    description: 'Profile description',
    example: 'I help teachers learn modern web development and build educational applications.',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description: string;

  @ApiProperty({
    description: 'Types of support offered',
    example: ['CHAT', 'MENTORSHIP'],
    enum: SupportTypeDto,
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(SupportTypeDto, { each: true })
  supportTypes: SupportTypeDto[];

  @ApiProperty({
    description: 'Available days',
    example: ['Monday', 'Tuesday', 'Wednesday'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  availabilityDays: string[];

  @ApiProperty({
    description: 'Available time range (optional)',
    example: '18:00-21:00',
    required: false,
  })
  @IsOptional()
  @IsString()
  availabilityTime?: string;

  @ApiProperty({
    description: 'Maximum number of concurrent active requests',
    example: 5,
    default: 5,
  })
  @IsInt()
  @Min(1)
  @Max(20)
  maxActiveRequests: number;

  @ApiProperty({
    description: 'Whether the provider is currently available',
    example: true,
    default: true,
  })
  @IsBoolean()
  isAvailable: boolean;
}
