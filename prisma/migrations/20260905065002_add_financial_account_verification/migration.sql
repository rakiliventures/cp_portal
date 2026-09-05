-- AlterTable: add verification tracking to manual invoice/credit entries
ALTER TABLE "FinancialAccount" ADD COLUMN "verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "FinancialAccount" ADD COLUMN "verified_by_id" TEXT;
ALTER TABLE "FinancialAccount" ADD COLUMN "verified_at" TIMESTAMP(3);

ALTER TABLE "FinancialAccount" ADD CONSTRAINT "FinancialAccount_verified_by_id_fkey" FOREIGN KEY ("verified_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
