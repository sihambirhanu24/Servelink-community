import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDecimal,
} from 'class-validator';

export enum PaymentMethod {
  TELEBIRR = 'TELEBIRR',
  CBE_BIRR = 'CBE_BIRR',
  MPESA = 'MPESA',
  BANK_CARD = 'BANK_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export class CreatePaymentDto {
  @IsNotEmpty()
  @IsString()
  liveSessionId: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
