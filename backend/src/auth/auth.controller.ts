import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import {
  Req,
  Get,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import {
  MAX_VERIFICATION_DOCUMENTS,
  verificationMulterConfig,
} from "../teacher/config/verification-multer.config";

import { AuthService } from './auth.service';

import { RegisterDto } from '../auth/dto/register.dto';
import { LoginDto } from '../auth/dto/login.dto';

import { GetUser } from '../auth/decorators/get-user.decorator';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

 @ApiOperation({
  summary: 'Register teacher',
})

@ApiResponse({
  status: 201,
  description: 'Teacher registered successfully',
})

@ApiConsumes('multipart/form-data')
@Post('register')
@UseInterceptors(
  FilesInterceptor(
    'documents',
    MAX_VERIFICATION_DOCUMENTS,
    verificationMulterConfig,
  ),
)
register(
  @Body() dto: RegisterDto,
  @UploadedFiles() documents: Express.Multer.File[],
) {
  return this.authService.register(dto, documents);
}

 @ApiOperation({
  summary: 'Login teacher',
})

@ApiResponse({
  status: 200,
  description: 'Login successful',
})

@ApiResponse({
  status: 401,
  description: 'Invalid email or password',
})

@Post('login')
login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
}
@ApiBearerAuth()

@ApiOperation({
  summary: 'Get current teacher profile',
})

@UseGuards(JwtAuthGuard)

@Get('profile')
@UseGuards(JwtAuthGuard)
profile(@GetUser() user: any) {
  return user;
}
@Get("me")
@UseGuards(JwtAuthGuard)
me(@Req() req) {
  return this.authService.me(req.user.sub);
}

@Post("forgot-password")
forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
}
@Post("reset-password")
resetPassword(
    @Body()
    dto: ResetPasswordDto,
){

    return this.authService.resetPassword(
        dto.token,
        dto.password,
    );

}

  @Post('admin/login')
  @ApiOperation({ summary: 'Admin login - use admin email & password' })
  @ApiResponse({ status: 200, description: 'Admin logged in successfully' })
  @ApiResponse({ status: 401, description: 'Invalid admin credentials' })
  adminLogin(@Body() body: { email: string; password: string }) {
    return this.authService.adminLogin(body.email, body.password);
  }
}