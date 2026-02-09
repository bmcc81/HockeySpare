/*
  Warnings:

  - The values [LW,C,RW,LD,RD,G] on the enum `Position` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `PlayerOffer` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `endsAt` on the `PlayerOffer` table. All the data in the column will be lost.
  - You are about to drop the column `payCents` on the `PlayerOffer` table. All the data in the column will be lost.
  - You are about to drop the column `skill` on the `PlayerOffer` table. All the data in the column will be lost.
  - You are about to drop the column `startsAt` on the `PlayerOffer` table. All the data in the column will be lost.
  - The `id` column on the `PlayerOffer` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Request` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `endsAt` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the column `payCents` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the column `skill` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the column `startsAt` on the `Request` table. All the data in the column will be lost.
  - The `id` column on the `Request` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `skillLevel` to the `PlayerOffer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `time` to the `PlayerOffer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `skillLevel` to the `Request` table without a default value. This is not possible if the table is not empty.
  - Added the required column `time` to the `Request` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Request` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('TEAM_NEEDS_PLAYER', 'PLAYER_NEEDS_TEAM');

-- AlterEnum
BEGIN;
CREATE TYPE "Position_new" AS ENUM ('GOALIE', 'DEFENSE', 'FORWARD');
ALTER TABLE "Request" ALTER COLUMN "position" TYPE "Position_new" USING ("position"::text::"Position_new");
ALTER TABLE "PlayerOffer" ALTER COLUMN "position" TYPE "Position_new" USING ("position"::text::"Position_new");
ALTER TYPE "Position" RENAME TO "Position_old";
ALTER TYPE "Position_new" RENAME TO "Position";
DROP TYPE "public"."Position_old";
COMMIT;

-- DropIndex
DROP INDEX "PlayerOffer_position_skill_idx";

-- DropIndex
DROP INDEX "PlayerOffer_startsAt_idx";

-- DropIndex
DROP INDEX "Request_position_skill_idx";

-- DropIndex
DROP INDEX "Request_startsAt_idx";

-- AlterTable
ALTER TABLE "PlayerOffer" DROP CONSTRAINT "PlayerOffer_pkey",
DROP COLUMN "endsAt",
DROP COLUMN "payCents",
DROP COLUMN "skill",
DROP COLUMN "startsAt",
ADD COLUMN     "arenaAddress" TEXT,
ADD COLUMN     "payAmount" INTEGER,
ADD COLUMN     "playerName" TEXT,
ADD COLUMN     "skillLevel" "SkillLevel" NOT NULL,
ADD COLUMN     "time" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "PlayerOffer_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Request" DROP CONSTRAINT "Request_pkey",
DROP COLUMN "endsAt",
DROP COLUMN "payCents",
DROP COLUMN "skill",
DROP COLUMN "startsAt",
ADD COLUMN     "arenaAddress" TEXT,
ADD COLUMN     "payAmount" INTEGER,
ADD COLUMN     "playerName" TEXT,
ADD COLUMN     "skillLevel" "SkillLevel" NOT NULL,
ADD COLUMN     "teamName" TEXT,
ADD COLUMN     "time" TEXT NOT NULL,
ADD COLUMN     "type" "RequestType" NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Request_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "PlayerOffer_position_skillLevel_idx" ON "PlayerOffer"("position", "skillLevel");

-- CreateIndex
CREATE INDEX "Request_type_idx" ON "Request"("type");

-- CreateIndex
CREATE INDEX "Request_position_skillLevel_idx" ON "Request"("position", "skillLevel");
