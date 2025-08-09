/*
  Warnings:

  - Added the required column `type` to the `Rule` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."RuleType" AS ENUM ('SEMANTIC_BLOCK', 'KEYWORD_BLOCK');

-- AlterTable
ALTER TABLE "public"."Rule" ADD COLUMN     "type" "public"."RuleType" NOT NULL;
