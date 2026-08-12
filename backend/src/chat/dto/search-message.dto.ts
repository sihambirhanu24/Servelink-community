import { IsString, IsNotEmpty, IsOptional, Min, Max } from 'class-validator';

export class SearchMessageDto {
  @IsString()
  @IsNotEmpty()
  query: string;

  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
