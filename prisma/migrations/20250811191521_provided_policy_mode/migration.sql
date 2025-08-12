/*
  Warnings:

  - Added the required column `mode` to the `Policy` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."PolicyStrategy" AS ENUM ('BLOCKLIST', 'ALLOWLIST');

-- AlterTable
ALTER TABLE "public"."Policy" ADD COLUMN     "mode" "public"."PolicyStrategy" NOT NULL;
