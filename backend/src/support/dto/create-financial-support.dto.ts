import { IsString, IsNumber, IsOptional, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFinancialSupportRequestDto {
  @IsNumber()
  @Min(1, { message: 'Amount must be at least 1 ETB' })
  @Type(() => Number)
  amountNeeded: number;

  @IsString()
  @MaxLength(500, { message: 'Reason cannot exceed 500 characters' })
  reason: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'Additional notes cannot exceed 1000 characters' })
  additionalNotes?: string;
}
