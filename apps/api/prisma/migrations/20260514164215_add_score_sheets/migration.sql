-- CreateEnum
CREATE TYPE "ScoreSheetStatus" AS ENUM ('DRAFT', 'FINALIZED');

-- AlterEnum
ALTER TYPE "LeagueRole" ADD VALUE 'TIMEKEEPER';

-- AlterTable
ALTER TABLE "LeagueMember" ADD COLUMN     "gameScoreSheetId" TEXT;

-- CreateTable
CREATE TABLE "GameScoreSheet" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "teamScore" INTEGER NOT NULL DEFAULT 0,
    "opponentScore" INTEGER NOT NULL DEFAULT 0,
    "status" "ScoreSheetStatus" NOT NULL DEFAULT 'DRAFT',
    "finalizedAt" TIMESTAMP(3),
    "finalizedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameScoreSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameScoreSheetPlayer" (
    "id" TEXT NOT NULL,
    "scoreSheetId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 1,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "penaltyMins" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameScoreSheetPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameScoreSheet_gameId_key" ON "GameScoreSheet"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "GameScoreSheetPlayer_scoreSheetId_memberId_key" ON "GameScoreSheetPlayer"("scoreSheetId", "memberId");

-- AddForeignKey
ALTER TABLE "LeagueMember" ADD CONSTRAINT "LeagueMember_gameScoreSheetId_fkey" FOREIGN KEY ("gameScoreSheetId") REFERENCES "GameScoreSheet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameScoreSheet" ADD CONSTRAINT "GameScoreSheet_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "TeamGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameScoreSheet" ADD CONSTRAINT "GameScoreSheet_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameScoreSheet" ADD CONSTRAINT "GameScoreSheet_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameScoreSheet" ADD CONSTRAINT "GameScoreSheet_finalizedById_fkey" FOREIGN KEY ("finalizedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameScoreSheetPlayer" ADD CONSTRAINT "GameScoreSheetPlayer_scoreSheetId_fkey" FOREIGN KEY ("scoreSheetId") REFERENCES "GameScoreSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameScoreSheetPlayer" ADD CONSTRAINT "GameScoreSheetPlayer_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
