import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initialize')
  createPayment(@CurrentUser() user: any, @Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.createPayment(user.sub, createPaymentDto);
  }

  @Post('verify')
  verifyPayment(@Body() verifyPaymentDto: VerifyPaymentDto) {
    return this.paymentService.verifyPayment(verifyPaymentDto);
  }

  @Post('webhook')
  handleWebhook(@Body() payload: any) {
    return this.paymentService.handleWebhook(payload);
  }

  @Get('history')
  getPaymentHistory(@CurrentUser() user: any) {
    return this.paymentService.getPaymentHistory(user.sub);
  }

  @Get(':id')
  getPaymentById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.paymentService.getPaymentById(id, user.sub);
  }
}
