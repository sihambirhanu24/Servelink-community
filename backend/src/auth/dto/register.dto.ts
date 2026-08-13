import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
  MinLength,
} from 'class-validator';

import { TeacherLevelType } from '@prisma/client';

export class RegisterDto {
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
    example: false,
    required: false,
    description: 'Whether the teacher is verified',
  })
  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  // @ApiProperty({
  //   enum: TeacherLevelType,
  //   example: TeacherLevelType.LEVEL_1,
  //   description: 'Teacher level',
  // })
  // @IsEnum(TeacherLevelType)
  // level: TeacherLevelType;

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
    required: false,
    description:
      'Professional department (e.g. Mathematics, English, Physics). ' +
      'Required for LEVEL_2–5 teachers to be placed in department communities.',
  })
  @IsOptional()
  @IsString()
  department?: string;
}