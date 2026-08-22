import { IsOptional, IsString, IsInt, Min, Max } from "class-validator";

export class VerificationSetupDto {
  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  profession?: string;

  @IsOptional()
  @IsString()
  teacherIdNumber?: string;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsString()
  skills?: string;

  @IsOptional()
  @IsString()
  gradeLevel?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  yearsOfExperience?: number;

  @IsOptional()
  @IsString()
  schoolType?: string;

  @IsOptional()
  @IsString()
  city?: string;
}
