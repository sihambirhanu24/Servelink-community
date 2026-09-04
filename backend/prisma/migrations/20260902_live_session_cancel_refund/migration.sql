-- AlterEnum
ALTER TYPE "EarningStatus" ADD VALUE IF NOT EXISTS 'REVERSED';

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "RefundStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'PROCESSING', 'REFUNDED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable LiveSession
ALTER TABLE "LiveSession" ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3);
ALTER TABLE "LiveSession" ADD COLUMN IF NOT EXISTS "cancelledById" TEXT;
ALTER TABLE "LiveSession" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

-- AlterTable Payment
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "refundStatus" "RefundStatus" NOT NULL DEFAULT 'NOT_REQUIRED';
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "chapaRefundRefId" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "refundIdempotencyKey" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "refundFailureReason" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "refundInitiatedAt" TIMESTAMP(3);
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "refundLastCheckedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "Payment_refundIdempotencyKey_key" ON "Payment"("refundIdempotencyKey");
CREATE INDEX IF NOT EXISTS "Payment_refundStatus_idx" ON "Payment"("refundStatus");

-- Allow session deletion without destroying payment history
ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS "Payment_liveSessionId_fkey";
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "LiveSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable TeacherEarning
ALTER TABLE "TeacherEarning" ADD COLUMN IF NOT EXISTS "refundReviewRequired" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE IF NOT EXISTS "FinancialAuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorIsAdmin" BOOLEAN NOT NULL DEFAULT false,
    "action" TEXT NOT NULL,
    "liveSessionId" TEXT,
    "paymentId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FinancialAuditLog_liveSessionId_idx" ON "FinancialAuditLog"("liveSessionId");
CREATE INDEX IF NOT EXISTS "FinancialAuditLog_paymentId_idx" ON "FinancialAuditLog"("paymentId");
CREATE INDEX IF NOT EXISTS "FinancialAuditLog_createdAt_idx" ON "FinancialAuditLog"("createdAt");

ALTER TABLE "FinancialAuditLog" DROP CONSTRAINT IF EXISTS "FinancialAuditLog_liveSessionId_fkey";
ALTER TABLE "FinancialAuditLog" ADD CONSTRAINT "FinancialAuditLog_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "LiveSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FinancialAuditLog" DROP CONSTRAINT IF EXISTS "FinancialAuditLog_paymentId_fkey";
ALTER TABLE "FinancialAuditLog" ADD CONSTRAINT "FinancialAuditLog_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
