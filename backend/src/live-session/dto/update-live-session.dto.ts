import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class ApproveLiveSessionDto {
  @IsString()
  @IsOptional()
  adminId?: string;
}

export class RejectLiveSessionDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class RescheduleLiveSessionDto {
  @IsDateString()
  @IsNotEmpty()
  scheduledStart: string;
}

export class UpdateLiveSessionStatusDto {
  @IsString()
  @IsNotEmpty()
  status: 'LIVE' | 'COMPLETED' | 'CANCELLED';
}
