/*
  Warnings:

  - Changed the type of `position` on the `PlayerOffer` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `skillLevel` on the `PlayerOffer` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "PlayerOffer" DROP COLUMN "position",
ADD COLUMN     "position" "Position" NOT NULL,
DROP COLUMN "skillLevel",
ADD COLUMN     "skillLevel" "SkillLevel" NOT NULL;
