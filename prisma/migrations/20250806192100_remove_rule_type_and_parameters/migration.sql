/*
  Warnings:

  - You are about to drop the column `parameters` on the `Rule` table. All the data in the column will be lost.
  - You are about to drop the column `ruleType` on the `Rule` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Rule" DROP COLUMN "parameters",
DROP COLUMN "ruleType";
