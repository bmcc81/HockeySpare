-- CreateTable
CREATE TABLE "TournamentBracket" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "division" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentBracket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentBracketMatch" (
    "id" TEXT NOT NULL,
    "bracketId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "team1Id" TEXT,
    "team2Id" TEXT,
    "gameId" TEXT,
    "winnerTeamId" TEXT,
    "nextMatchId" TEXT,
    "nextMatchSlot" INTEGER,
    "isBye" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentBracketMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TournamentBracket_tournamentId_idx" ON "TournamentBracket"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentBracketMatch_gameId_key" ON "TournamentBracketMatch"("gameId");

-- CreateIndex
CREATE INDEX "TournamentBracketMatch_bracketId_round_idx" ON "TournamentBracketMatch"("bracketId", "round");

-- CreateIndex
CREATE INDEX "TournamentBracketMatch_nextMatchId_idx" ON "TournamentBracketMatch"("nextMatchId");

-- CreateIndex
CREATE INDEX "TournamentBracketMatch_team1Id_idx" ON "TournamentBracketMatch"("team1Id");

-- CreateIndex
CREATE INDEX "TournamentBracketMatch_team2Id_idx" ON "TournamentBracketMatch"("team2Id");

-- AddForeignKey
ALTER TABLE "TournamentBracket" ADD CONSTRAINT "TournamentBracket_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentBracketMatch" ADD CONSTRAINT "TournamentBracketMatch_bracketId_fkey" FOREIGN KEY ("bracketId") REFERENCES "TournamentBracket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentBracketMatch" ADD CONSTRAINT "TournamentBracketMatch_team1Id_fkey" FOREIGN KEY ("team1Id") REFERENCES "TournamentTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentBracketMatch" ADD CONSTRAINT "TournamentBracketMatch_team2Id_fkey" FOREIGN KEY ("team2Id") REFERENCES "TournamentTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentBracketMatch" ADD CONSTRAINT "TournamentBracketMatch_winnerTeamId_fkey" FOREIGN KEY ("winnerTeamId") REFERENCES "TournamentTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentBracketMatch" ADD CONSTRAINT "TournamentBracketMatch_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "TournamentGame"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentBracketMatch" ADD CONSTRAINT "TournamentBracketMatch_nextMatchId_fkey" FOREIGN KEY ("nextMatchId") REFERENCES "TournamentBracketMatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
