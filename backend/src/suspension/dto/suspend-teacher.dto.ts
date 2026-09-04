import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';
import { SuspensionType } from '@prisma/client';

export class SuspendTeacherDto {
  @IsString()
  teacherId: string;

  @IsEnum(SuspensionType)
  suspensionType: SuspensionType;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  duration?: number; // in days for temporary suspension

  @IsOptional()
  @IsString()
  reportId?: string;
}

export class UnsuspendTeacherDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class ExtendSuspensionDto {
  @IsInt()
  @Min(1)
  @Max(365)
  days: number;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason: string;
}

/** Body of PATCH /admin/teachers/:id/suspend (teacher id comes from the route). */
export class AdminSuspendTeacherDto {
  @IsOptional()
  @IsEnum(SuspensionType)
  suspensionType?: SuspensionType;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  durationDays?: number;

  @IsOptional()
  @IsString()
  reportId?: string;
}
