import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
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
  createPayment(
    @CurrentUser() user: any,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
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

  @Post(':id/refund/retry')
  retryRefund(@Param('id') id: string, @CurrentUser() user: any) {
    if (!user.isAdmin) {
      throw new ForbiddenException('Only admins can retry refunds');
    }
    return this.paymentService.initiateRefundForPayment(
      id,
      'Admin retry of session refund',
      { force: true },
    );
  }

  @Post(':id/refund/verify')
  verifyRefund(@Param('id') id: string, @CurrentUser() user: any) {
    if (!user.isAdmin) {
      throw new ForbiddenException('Only admins can verify refunds');
    }
    return this.paymentService.verifyRefundForPayment(id);
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
