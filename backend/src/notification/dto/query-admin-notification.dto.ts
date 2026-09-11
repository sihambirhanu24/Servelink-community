import { IsOptional, IsEnum, IsBoolean, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AdminNotificationEvent } from '../admin-notification.types';

export class QueryAdminNotificationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsEnum(AdminNotificationEvent)
  type?: AdminNotificationEvent;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  unread?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}
