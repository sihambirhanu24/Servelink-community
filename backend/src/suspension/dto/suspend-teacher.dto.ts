import { IsString, IsEnum, IsOptional, IsInt, Min } from 'class-validator';

export class SuspendTeacherDto {
  @IsString()
  teacherId: string;

  @IsEnum(['WARNING', 'TEMPORARY', 'PERMANENT'])
  suspensionType: 'WARNING' | 'TEMPORARY' | 'PERMANENT';

  @IsString()
  reason: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number; // in days for temporary suspension

  @IsOptional()
  @IsString()
  reportId?: string;
}
