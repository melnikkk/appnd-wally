-- AlterTable
ALTER TABLE "public"."Policy" ADD COLUMN     "threshold" DOUBLE PRECISION NOT NULL DEFAULT 0.7;

-- AlterTable
ALTER TABLE "public"."Rule" ADD COLUMN     "threshold" DOUBLE PRECISION;
