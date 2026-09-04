import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PayoutService } from './payout.service';

@Injectable()
export class PayoutVerificationService {
  private readonly logger = new Logger(PayoutVerificationService.name);

  constructor(private readonly payoutService: PayoutService) {}

  /**
   * Run every 5 minutes to verify PROCESSING payouts with Chapa
   * This ensures payouts move from PROCESSING to COMPLETED/FAILED automatically
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async verifyProcessingPayouts() {
    this.logger.log(
      '[PayoutVerification] Starting verification of PROCESSING payouts...',
    );

    try {
      // Get all PROCESSING payouts that haven't been verified in the last 5 minutes
      // This avoids hammering Chapa API with unnecessary checks
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const processingPayouts =
        await this.payoutService.getProcessingPayoutsNeedingVerification(
          fiveMinutesAgo,
        );

      this.logger.log(
        `[PayoutVerification] Found ${processingPayouts.length} payouts to verify`,
      );

      for (const payout of processingPayouts) {
        try {
          this.logger.log(
            `[PayoutVerification] Verifying payout ${payout.reference} for teacher ${payout.teacherId}`,
          );

          await this.payoutService.verifyPayoutStatus(
            payout.reference,
            payout.teacherId,
          );

          this.logger.log(
            `[PayoutVerification] Successfully verified payout ${payout.reference}`,
          );
        } catch (error: any) {
          this.logger.error(
            `[PayoutVerification] Failed to verify payout ${payout.reference}: ${error.message}`,
          );
        }
      }

      this.logger.log('[PayoutVerification] Verification cycle completed');
    } catch (error: any) {
      this.logger.error(
        `[PayoutVerification] Verification cycle failed: ${error.message}`,
      );
    }
  }
}
