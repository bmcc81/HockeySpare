-- CreateTable
CREATE TABLE "TournamentTeamFollow" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "lang" TEXT NOT NULL DEFAULT 'en',
    "token" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "confirmationSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentTeamFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentGameReminder" (
    "id" TEXT NOT NULL,
    "followId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentGameReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TournamentTeamFollow_token_key" ON "TournamentTeamFollow"("token");

-- CreateIndex
CREATE INDEX "TournamentTeamFollow_tournamentId_idx" ON "TournamentTeamFollow"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentTeamFollow_teamId_email_key" ON "TournamentTeamFollow"("teamId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentGameReminder_followId_gameId_startsAt_key" ON "TournamentGameReminder"("followId", "gameId", "startsAt");

-- AddForeignKey
ALTER TABLE "TournamentTeamFollow" ADD CONSTRAINT "TournamentTeamFollow_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentTeamFollow" ADD CONSTRAINT "TournamentTeamFollow_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "TournamentTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentGameReminder" ADD CONSTRAINT "TournamentGameReminder_followId_fkey" FOREIGN KEY ("followId") REFERENCES "TournamentTeamFollow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
