-- AlterTable
ALTER TABLE "TeamGame" ADD COLUMN     "opponentTeamId" TEXT;

-- CreateIndex
CREATE INDEX "TeamGame_opponentTeamId_startsAt_idx" ON "TeamGame"("opponentTeamId", "startsAt");

-- AddForeignKey
ALTER TABLE "TeamGame" ADD CONSTRAINT "TeamGame_opponentTeamId_fkey" FOREIGN KEY ("opponentTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
