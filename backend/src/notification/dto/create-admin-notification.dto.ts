import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { AdminNotificationEvent } from '../admin-notification.types';

export class CreateAdminNotificationDto {
  @IsString()
  adminId: string;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsEnum(AdminNotificationEvent)
  type: AdminNotificationEvent;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
