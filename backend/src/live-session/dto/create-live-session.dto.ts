import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsInt,
  Min,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsUrl,
  ValidateIf,
} from 'class-validator';

export enum LiveSessionProviderDto {
  LIVEKIT = 'LIVEKIT',
  GOOGLE_MEET = 'GOOGLE_MEET',
}

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
  visibility?: string; // LiveSessionVisibility

  /**
   * Which real-time communication provider to use.
   * Defaults to LIVEKIT when omitted.
   */
  @IsEnum(LiveSessionProviderDto)
  @IsOptional()
  provider?: LiveSessionProviderDto;

  /**
   * Required when provider = GOOGLE_MEET.
   * Must be a valid https://meet.google.com/... URL.
   * Must be absent (or null) when provider = LIVEKIT.
   */
  @ValidateIf((o) => o.provider === LiveSessionProviderDto.GOOGLE_MEET)
  @IsNotEmpty({
    message: 'Google Meet link is required when provider is GOOGLE_MEET.',
  })
  @IsString()
  meetingUrl?: string;
}
