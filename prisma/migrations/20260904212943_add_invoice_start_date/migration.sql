-- AlterTable: add invoice_start_date, backfill existing members, then enforce NOT NULL
ALTER TABLE "MemberProfile" ADD COLUMN "invoice_start_date" DATE;

UPDATE "MemberProfile" SET "invoice_start_date" = '2026-09-01';

ALTER TABLE "MemberProfile" ALTER COLUMN "invoice_start_date" SET NOT NULL;
