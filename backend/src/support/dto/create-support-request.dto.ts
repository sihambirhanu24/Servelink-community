import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  MinLength,
  MaxLength,
  IsNumber,
  IsPositive,
  ValidateIf,
  Min,
} from 'class-validator';

export enum SupportUrgencyDto {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum SupportPaymentTypeDto {
  FREE = 'FREE',
  PAID = 'PAID',
}

export class CreateSupportRequestDto {
  @ApiProperty({
    description: 'Support topic/subject',
    example: 'Need help with React hooks',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  topic: string;

  @ApiProperty({
    description: 'Detailed description of support needed',
    example: 'I am struggling with useEffect and want to understand when to use it.',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @ApiProperty({
    description: 'Type of support needed',
    enum: ['CHAT', 'LIVE_SESSION', 'RESOURCE', 'MENTORSHIP'],
    example: 'MENTORSHIP',
  })
  @IsEnum(['CHAT', 'LIVE_SESSION', 'RESOURCE', 'MENTORSHIP'])
  supportType: string;

  @ApiProperty({
    description: 'Urgency level',
    enum: SupportUrgencyDto,
    example: 'MEDIUM',
  })
  @IsEnum(SupportUrgencyDto)
  urgency: SupportUrgencyDto;

  @ApiProperty({
    description: 'Preferred date/time for support (ISO 8601 format)',
    example: '2026-08-20T15:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  preferredAt?: string;

  @ApiProperty({
    description: 'Additional notes',
    example: 'I am available in the evenings',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiProperty({
    description: 'Specific provider ID to request (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  providerId?: string;

  @ApiProperty({
    description: 'Payment type for the support request',
    enum: SupportPaymentTypeDto,
    example: 'FREE',
    default: 'FREE',
    required: false,
  })
  @IsOptional()
  @IsEnum(SupportPaymentTypeDto)
  paymentType?: SupportPaymentTypeDto;

  @ApiProperty({
    description: 'Amount to pay for support (required if paymentType is PAID)',
    example: 200,
    required: false,
  })
  @ValidateIf((o) => o.paymentType === 'PAID')
  @IsNumber()
  @IsPositive()
  @Min(1)
  requestedAmount?: number;

  @ApiProperty({
    description: 'Reason/justification for payment (required if paymentType is PAID)',
    example: 'I need approximately one hour of help understanding JWT authentication.',
    required: false,
  })
  @ValidateIf((o) => o.paymentType === 'PAID')
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  paymentReason?: string;
}
