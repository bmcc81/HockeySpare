-- CreateTable
CREATE TABLE "TournamentCoOrganizer" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentCoOrganizer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentAuditLogEntry" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentAuditLogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TournamentCoOrganizer_tournamentId_userId_key" ON "TournamentCoOrganizer"("tournamentId", "userId");

-- CreateIndex
CREATE INDEX "TournamentCoOrganizer_tournamentId_idx" ON "TournamentCoOrganizer"("tournamentId");

-- CreateIndex
CREATE INDEX "TournamentAuditLogEntry_tournamentId_createdAt_idx" ON "TournamentAuditLogEntry"("tournamentId", "createdAt");

-- AddForeignKey
ALTER TABLE "TournamentCoOrganizer" ADD CONSTRAINT "TournamentCoOrganizer_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentCoOrganizer" ADD CONSTRAINT "TournamentCoOrganizer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentAuditLogEntry" ADD CONSTRAINT "TournamentAuditLogEntry_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentAuditLogEntry" ADD CONSTRAINT "TournamentAuditLogEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
