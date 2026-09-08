import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryProvidersDto {
  @ApiProperty({
    description: 'Search by expertise or name',
    example: 'React',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filter by support type',
    enum: ['CHAT', 'LIVE_SESSION', 'RESOURCE', 'MENTORSHIP'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['CHAT', 'LIVE_SESSION', 'RESOURCE', 'MENTORSHIP'])
  supportType?: string;

  @ApiProperty({
    description: 'Filter by availability',
    example: true,
    required: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  isAvailable?: boolean;

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
