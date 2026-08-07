-- AlterTable
ALTER TABLE "TournamentGame" ADD COLUMN     "homeTeamId" TEXT,
ADD COLUMN     "awayTeamId" TEXT;

-- CreateTable
CREATE TABLE "TournamentTeam" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "division" TEXT,
    "logoUrl" TEXT,
    "coachName" TEXT,
    "registrationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentTeamPlayer" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "position" "Position",
    "jerseyNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentTeamPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentGamePlayerStat" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "teamPlayerId" TEXT NOT NULL,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "penaltyMins" INTEGER NOT NULL DEFAULT 0,
    "plusMinus" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentGamePlayerStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TournamentGame_homeTeamId_idx" ON "TournamentGame"("homeTeamId");

-- CreateIndex
CREATE INDEX "TournamentGame_awayTeamId_idx" ON "TournamentGame"("awayTeamId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentTeam_registrationId_key" ON "TournamentTeam"("registrationId");

-- CreateIndex
CREATE INDEX "TournamentTeam_tournamentId_idx" ON "TournamentTeam"("tournamentId");

-- CreateIndex
CREATE INDEX "TournamentTeamPlayer_teamId_idx" ON "TournamentTeamPlayer"("teamId");

-- CreateIndex
CREATE INDEX "TournamentGamePlayerStat_gameId_idx" ON "TournamentGamePlayerStat"("gameId");

-- CreateIndex
CREATE INDEX "TournamentGamePlayerStat_teamPlayerId_idx" ON "TournamentGamePlayerStat"("teamPlayerId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentGamePlayerStat_gameId_teamPlayerId_key" ON "TournamentGamePlayerStat"("gameId", "teamPlayerId");

-- AddForeignKey
ALTER TABLE "TournamentGame" ADD CONSTRAINT "TournamentGame_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "TournamentTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentGame" ADD CONSTRAINT "TournamentGame_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "TournamentTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentTeam" ADD CONSTRAINT "TournamentTeam_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentTeam" ADD CONSTRAINT "TournamentTeam_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "TournamentRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentTeamPlayer" ADD CONSTRAINT "TournamentTeamPlayer_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "TournamentTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentGamePlayerStat" ADD CONSTRAINT "TournamentGamePlayerStat_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "TournamentGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentGamePlayerStat" ADD CONSTRAINT "TournamentGamePlayerStat_teamPlayerId_fkey" FOREIGN KEY ("teamPlayerId") REFERENCES "TournamentTeamPlayer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
