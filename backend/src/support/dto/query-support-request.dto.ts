import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QuerySupportRequestDto {
  @ApiProperty({
    description: 'Filter by status',
    enum: [
      'PENDING',
      'ACCEPTED',
      'IN_PROGRESS',
      'COMPLETED',
      'DECLINED',
      'CANCELLED',
    ],
    required: false,
  })
  @IsOptional()
  @IsEnum([
    'PENDING',
    'ACCEPTED',
    'IN_PROGRESS',
    'COMPLETED',
    'DECLINED',
    'CANCELLED',
  ])
  status?: string;

  @ApiProperty({
    description: 'Filter by support type',
    enum: ['CHAT', 'LIVE_SESSION', 'RESOURCE', 'MENTORSHIP'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['CHAT', 'LIVE_SESSION', 'RESOURCE', 'MENTORSHIP'])
  supportType?: string;

  @ApiProperty({
    description: 'Filter by urgency',
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH'])
  urgency?: string;

  @ApiProperty({
    description: 'Page number',
    example: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({
    description: 'Items per page',
    example: 20,
    default: 20,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
