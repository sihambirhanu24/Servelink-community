import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const CONNECT_ATTEMPTS = 4;
const CONNECT_RETRY_DELAY_MS = 2000;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    // A single slow handshake to a remote/serverless Postgres (cold compute,
    // flaky uplink) should not take the whole API down at boot.
    for (let attempt = 1; ; attempt++) {
      try {
        await this.$connect();
        return;
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message.split('\n')[0] : String(error);
        if (attempt >= CONNECT_ATTEMPTS) {
          this.logger.error(
            `Database connection failed after ${attempt} attempts: ${message}`,
          );
          throw error;
        }
        this.logger.warn(
          `Database connection attempt ${attempt}/${CONNECT_ATTEMPTS} failed (${message}); retrying in ${CONNECT_RETRY_DELAY_MS}ms`,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, CONNECT_RETRY_DELAY_MS),
        );
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
