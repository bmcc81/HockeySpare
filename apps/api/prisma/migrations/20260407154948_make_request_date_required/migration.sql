/*
  Warnings:

  - Made the column `date` on table `Request` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Request" ALTER COLUMN "date" SET NOT NULL;
