import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
//what data expected
export class LoginDto {
  @ApiProperty({
    example: 'si@gmail.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '123456789',
  })
  @IsString()
  password: string;
}