-- CreateEnum
CREATE TYPE "AppRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('PLAYER', 'CAPTAIN', 'GENERAL_MANAGER');

-- CreateEnum
CREATE TYPE "LeagueRole" AS ENUM ('PLAYER', 'TEAM_MANAGER', 'LEAGUE_MANAGER');

-- CreateEnum
CREATE TYPE "TeamGameAvailabilityStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'NEED_SPARE');

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_ownerId_fkey";

-- DropIndex
DROP INDEX "Team_ownerId_key";

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "leagueId" TEXT,
ALTER COLUMN "ownerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TeamMember" ADD COLUMN     "role" "TeamRole" NOT NULL DEFAULT 'PLAYER';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "appRole" "AppRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "League" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "season" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "League_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueMember" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "LeagueRole" NOT NULL DEFAULT 'PLAYER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeagueMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamGameAvailability" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "status" "TeamGameAvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamGameAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerStat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "leagueId" TEXT,
    "season" TEXT,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "penaltyMins" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeagueMember_leagueId_role_idx" ON "LeagueMember"("leagueId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueMember_leagueId_userId_key" ON "LeagueMember"("leagueId", "userId");

-- CreateIndex
CREATE INDEX "TeamGameAvailability_gameId_status_idx" ON "TeamGameAvailability"("gameId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TeamGameAvailability_gameId_memberId_key" ON "TeamGameAvailability"("gameId", "memberId");

-- CreateIndex
CREATE INDEX "PlayerStat_teamId_idx" ON "PlayerStat"("teamId");

-- CreateIndex
CREATE INDEX "PlayerStat_leagueId_idx" ON "PlayerStat"("leagueId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerStat_userId_teamId_season_key" ON "PlayerStat"("userId", "teamId", "season");

-- CreateIndex
CREATE INDEX "Team_leagueId_idx" ON "Team"("leagueId");

-- CreateIndex
CREATE INDEX "TeamMember_teamId_role_idx" ON "TeamMember"("teamId", "role");

-- AddForeignKey
ALTER TABLE "LeagueMember" ADD CONSTRAINT "LeagueMember_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueMember" ADD CONSTRAINT "LeagueMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamGameAvailability" ADD CONSTRAINT "TeamGameAvailability_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "TeamGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamGameAvailability" ADD CONSTRAINT "TeamGameAvailability_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerStat" ADD CONSTRAINT "PlayerStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerStat" ADD CONSTRAINT "PlayerStat_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerStat" ADD CONSTRAINT "PlayerStat_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE SET NULL ON UPDATE CASCADE;
