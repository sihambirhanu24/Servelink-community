import { IsOptional, IsString } from 'class-validator';

export class AdminBroadcastDto {
  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  referenceId?: string;
}
