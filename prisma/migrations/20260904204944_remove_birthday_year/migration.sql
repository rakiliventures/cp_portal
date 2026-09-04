-- AlterTable: replace full-date birthday with day/month-only columns (year is not tracked)
ALTER TABLE "MemberProfile" ADD COLUMN "birthday_day" INTEGER;
ALTER TABLE "MemberProfile" ADD COLUMN "birthday_month" INTEGER;

-- Backfill from existing birthday values before dropping the column
UPDATE "MemberProfile"
SET "birthday_day"   = EXTRACT(DAY FROM "birthday")::INTEGER,
    "birthday_month" = EXTRACT(MONTH FROM "birthday")::INTEGER
WHERE "birthday" IS NOT NULL;

ALTER TABLE "MemberProfile" DROP COLUMN "birthday";
