-- AlterTable: track which admin created a manual invoice/credit entry (NULL = system-generated)
ALTER TABLE "FinancialAccount" ADD COLUMN "created_by_id" TEXT;

ALTER TABLE "FinancialAccount" ADD CONSTRAINT "FinancialAccount_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
