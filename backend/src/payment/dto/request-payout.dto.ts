import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class RequestPayoutDto {
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  bankCode: string;

  @IsNotEmpty()
  @IsString()
  bankAccountNumber: string;

  @IsNotEmpty()
  @IsString()
  bankAccountName: string;

  @IsOptional()
  @IsString()
  currency?: string;
}
