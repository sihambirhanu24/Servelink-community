import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

import { VerificationDocumentsDto } from '../../teacher/dto/verification-documents.dto';

/**
 * Verification state (verificationStatus, approvedAt, approvedBy,
 * rejectionReason) is owned by the backend and is intentionally absent here so
 * a client cannot register an already-approved teacher.
 */
export class RegisterDto extends VerificationDocumentsDto {
  @ApiProperty({
    example: 'Abel',
    description: 'Teacher first name',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    example: 'Bekele',
    description: 'Teacher last name',
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    example: 'abel@gmail.com',
    description: 'Teacher email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Password (minimum 8 characters)',
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    example: 'https://example.com/profile.jpg',
    required: false,
    description: 'Profile image URL',
  })
  @IsOptional()
  @IsString()
  profileImage?: string;

  @ApiProperty({
    example: 'Mathematics',
    required: false,
    description: 'Subject taught by the teacher',
  })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({
    example: 'TCH-2024-00913',
    required: false,
    description:
      'Teacher / staff identification number shown on the uploaded ID',
  })
  @IsOptional()
  @IsString()
  teacherIdNumber?: string;

  @ApiProperty({
    example: 'Adama Science and Technology University',
    description: 'School or university',
  })
  @IsString()
  school: string;

  @ApiProperty({
    example: 'Adama',
    description: 'Woreda',
  })
  @IsString()
  woreda: string;

  @ApiProperty({
    example: 'East Shewa',
    description: 'Zone',
  })
  @IsString()
  zone: string;

  @ApiProperty({
    example: 'Oromia',
    description: 'Region',
  })
  @IsString()
  region: string;

  @ApiProperty({
    example: 'Mathematics',
    description:
      'Professional department (e.g. Mathematics, English, Physics). ' +
      'Required for teachers to be placed in department-specific communities.',
  })
  @IsString()
  department: string;
}