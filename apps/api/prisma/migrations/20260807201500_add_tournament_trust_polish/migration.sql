-- CreateEnum
CREATE TYPE "TournamentSponsorTier" AS ENUM ('GOLD', 'SILVER', 'BRONZE');

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT;

-- AlterTable
ALTER TABLE "TournamentSponsor" ADD COLUMN     "tier" "TournamentSponsorTier";

-- CreateTable
CREATE TABLE "TournamentAnnouncement" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentVenue" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "parkingInfo" TEXT,
    "dressingRoomInfo" TEXT,
    "concessionsInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentVenue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TournamentAnnouncement_tournamentId_createdAt_idx" ON "TournamentAnnouncement"("tournamentId", "createdAt");

-- CreateIndex
CREATE INDEX "TournamentVenue_tournamentId_idx" ON "TournamentVenue"("tournamentId");

-- AddForeignKey
ALTER TABLE "TournamentAnnouncement" ADD CONSTRAINT "TournamentAnnouncement_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentVenue" ADD CONSTRAINT "TournamentVenue_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
