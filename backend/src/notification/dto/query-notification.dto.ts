import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { NotificationEvent } from '../notification.types';

export class QueryNotificationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(NotificationEvent)
  type?: NotificationEvent;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  unread?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}
