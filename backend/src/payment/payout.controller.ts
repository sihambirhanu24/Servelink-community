import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
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

  @Post('chapa/webhook')
  async handleChapaWebhook(@Body() payload: any) {
    console.log('[PayoutController] Chapa webhook received:', payload);
    return this.payoutService.handleChapaWebhook(payload);
  }

  // TEST MODE ONLY: Simulate webhook for local testing
  @Post('chapa/webhook/simulate')
  async simulateWebhook(
    @Body() payload: { reference: string; status: 'success' | 'failed' },
  ) {
    const isTestMode =
      process.env.CHAPA_TEST_MODE === 'true' ||
      process.env.NODE_ENV === 'development';

    if (!isTestMode) {
      throw new BadRequestException(
        'Webhook simulation is only available in test mode',
      );
    }

    console.log(
      '[PayoutController] Simulating webhook for reference:',
      payload.reference,
      'status:',
      payload.status,
    );

    const webhookPayload = {
      event: payload.status === 'success' ? 'payout.success' : 'payout.failed',
      type: 'transfer',
      reference: payload.reference,
      chapa_reference: `CHAPA_TEST_${Date.now()}`,
      bank_reference: `BANK_TEST_${Date.now()}`,
      status: payload.status,
      message:
        payload.status === 'success'
          ? 'Transfer completed successfully'
          : 'Transfer failed',
    };

    return this.payoutService.handleChapaWebhook(webhookPayload);
  }

  @UseGuards(JwtAuthGuard)
  @Get('banks')
  getBanks() {
    return this.paymentService.getChapaBanks();
  }

  @UseGuards(JwtAuthGuard)
  @Get('verify/:reference')
  verifyPayout(
    @Param('reference') reference: string,
    @CurrentUser() user: any,
  ) {
    return this.payoutService.verifyPayoutStatus(reference, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('request')
  requestPayout(
    @CurrentUser() user: any,
    @Body() requestPayoutDto: RequestPayoutDto,
  ) {
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

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  cancelPayout(@Param('id') id: string, @CurrentUser() user: any) {
    return this.payoutService.cancelPayout(id, user.sub);
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
  completePayout(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('overrideReason') overrideReason?: string,
  ) {
    return this.payoutService.completePayout(id, user.sub, overrideReason);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/dashboard')
  getFinanceDashboard() {
    return this.payoutService.getFinanceDashboard();
  }
}
