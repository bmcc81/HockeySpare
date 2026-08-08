-- CreateTable
CREATE TABLE "TournamentApiKey" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "TournamentApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentWebhook" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TournamentApiKey_keyHash_key" ON "TournamentApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "TournamentApiKey_tournamentId_idx" ON "TournamentApiKey"("tournamentId");

-- CreateIndex
CREATE INDEX "TournamentWebhook_tournamentId_idx" ON "TournamentWebhook"("tournamentId");

-- AddForeignKey
ALTER TABLE "TournamentApiKey" ADD CONSTRAINT "TournamentApiKey_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentWebhook" ADD CONSTRAINT "TournamentWebhook_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
