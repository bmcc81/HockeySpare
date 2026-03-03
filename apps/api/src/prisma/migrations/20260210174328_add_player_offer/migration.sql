/*
  Warnings:

  - Made the column `arena` on table `PlayerOffer` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `position` on the `PlayerOffer` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `arenaAddress` on table `PlayerOffer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `payAmount` on table `PlayerOffer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `playerName` on table `PlayerOffer` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `skillLevel` on the `PlayerOffer` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropIndex
DROP INDEX "PlayerOffer_position_skillLevel_idx";

-- AlterTable
ALTER TABLE "PlayerOffer" ALTER COLUMN "arena" SET NOT NULL,
DROP COLUMN "position",
ADD COLUMN     "position" TEXT NOT NULL,
ALTER COLUMN "arenaAddress" SET NOT NULL,
ALTER COLUMN "payAmount" SET NOT NULL,
ALTER COLUMN "playerName" SET NOT NULL,
DROP COLUMN "skillLevel",
ADD COLUMN     "skillLevel" TEXT NOT NULL;
