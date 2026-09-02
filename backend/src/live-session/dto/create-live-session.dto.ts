import { IsString, IsNotEmpty, IsDateString, IsInt, Min, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateLiveSessionDto {
  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsNotEmpty()
  scheduledStart: string;

  @IsInt()
  @Min(5)
  duration: number;

  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  maxParticipants?: number;

  @IsString()
  @IsOptional()
  visibility?: any; // LiveSessionVisibility

  @IsString()
  @IsOptional()
  restreamUrl?: string;
}

