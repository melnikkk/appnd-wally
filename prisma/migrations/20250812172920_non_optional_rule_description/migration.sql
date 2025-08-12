/*
  Warnings:

  - Made the column `description` on table `Rule` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Rule" ALTER COLUMN "description" SET NOT NULL;
