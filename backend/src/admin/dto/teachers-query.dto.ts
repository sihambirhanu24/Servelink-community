import { IsOptional, IsString, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class TeachersQueryDto {
  @IsOptional()
  @IsString()
  search?: string; // matches against firstName/lastName/email

  @IsOptional()
  @IsString()
  status?: 'ACTIVE' | 'SUSPENDED';

  @IsOptional()
  @IsString()
  teacherLevel?: string;

  @IsOptional()
  @Type(() => Number) // query params arrive as strings; this coerces "2" -> 2
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 20;

  @IsOptional()
  @IsIn(['firstName', 'lastName', 'email', 'createdAt'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
