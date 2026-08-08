-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "rulebookUrl" TEXT;

-- CreateTable
CREATE TABLE "TournamentMediaAsset" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentMediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TournamentMediaAsset_tournamentId_createdAt_idx" ON "TournamentMediaAsset"("tournamentId", "createdAt");

-- AddForeignKey
ALTER TABLE "TournamentMediaAsset" ADD CONSTRAINT "TournamentMediaAsset_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
