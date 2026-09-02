import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PayoutService } from './payout.service';
import { RequestPayoutDto } from './dto/request-payout.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { PaymentService } from './payment.service';

@Controller('payouts')
export class PayoutController {
  constructor(
    private readonly payoutService: PayoutService,
    private readonly paymentService: PaymentService,
  ) {}

  // Teacher endpoints
  @UseGuards(JwtAuthGuard)
  @Get('wallet')
  getTeacherWallet(@CurrentUser() user: any) {
    return this.payoutService.getTeacherWallet(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('banks')
  getBanks() {
    return this.paymentService.getChapaBanks();
  }

  @UseGuards(JwtAuthGuard)
  @Get('verify/:reference')
  verifyPayout(@Param('reference') reference: string, @CurrentUser() user: any) {
    return this.payoutService.verifyPayoutStatus(reference, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('request')
  requestPayout(@CurrentUser() user: any, @Body() requestPayoutDto: RequestPayoutDto) {
    return this.payoutService.requestPayout(user.sub, requestPayoutDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  getPayoutHistory(@CurrentUser() user: any) {
    return this.payoutService.getPayoutHistory(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getPayoutProfile(@CurrentUser() user: any) {
    return this.payoutService.getPayoutProfile(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  updatePayoutProfile(@CurrentUser() user: any, @Body() profileData: any) {
    return this.payoutService.updatePayoutProfile(user.sub, profileData);
  }

  // Admin endpoints
  @UseGuards(JwtAuthGuard)
  @Get('admin/all')
  getAllPayouts(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.payoutService.getAllPayouts(
      status,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/:id/approve')
  approvePayout(@Param('id') id: string, @CurrentUser() user: any) {
    return this.payoutService.approvePayout(id, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/:id/reject')
  rejectPayout(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('reason') reason: string,
  ) {
    return this.payoutService.rejectPayout(id, user.sub, reason);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/:id/process')
  processPayout(@Param('id') id: string, @CurrentUser() user: any) {
    return this.payoutService.processPayout(id, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/:id/complete')
  completePayout(@Param('id') id: string, @CurrentUser() user: any) {
    return this.payoutService.completePayout(id, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/dashboard')
  getFinanceDashboard() {
    return this.payoutService.getFinanceDashboard();
  }
}
