/*
  Warnings:

  - A unique constraint covering the columns `[memberId,season]` on the table `PlayerStat` will be added. If there are existing duplicate values, this will fail.
  - Made the column `season` on table `PlayerStat` required. This step will fail if there are existing NULL values in that column.
  - Made the column `memberId` on table `PlayerStat` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "PlayerStat" DROP CONSTRAINT "PlayerStat_memberId_fkey";

-- DropForeignKey
ALTER TABLE "PlayerStat" DROP CONSTRAINT "PlayerStat_userId_fkey";

-- DropIndex
DROP INDEX "PlayerStat_memberId_idx";

-- DropIndex
DROP INDEX "PlayerStat_userId_teamId_season_key";

-- AlterTable
ALTER TABLE "PlayerStat" ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "season" SET NOT NULL,
ALTER COLUMN "memberId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "PlayerStat_userId_idx" ON "PlayerStat"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerStat_memberId_season_key" ON "PlayerStat"("memberId", "season");

-- AddForeignKey
ALTER TABLE "PlayerStat" ADD CONSTRAINT "PlayerStat_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerStat" ADD CONSTRAINT "PlayerStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
