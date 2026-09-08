import { IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ContributeFinancialSupportDto {
  @IsString()
  supportRequestId: string;

  @IsNumber()
  @Min(1, { message: 'Contribution amount must be at least 1 ETB' })
  @Type(() => Number)
  amount: number;
}
