/*
  Warnings:

  - You are about to drop the column `arena` on the `TeamGame` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TeamGame" DROP COLUMN "arena",
ADD COLUMN     "arenaId" TEXT,
ADD COLUMN     "leagueId" TEXT;

-- CreateIndex
CREATE INDEX "TeamGame_leagueId_startsAt_idx" ON "TeamGame"("leagueId", "startsAt");

-- CreateIndex
CREATE INDEX "TeamGame_arenaId_idx" ON "TeamGame"("arenaId");

-- AddForeignKey
ALTER TABLE "TeamGame" ADD CONSTRAINT "TeamGame_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamGame" ADD CONSTRAINT "TeamGame_arenaId_fkey" FOREIGN KEY ("arenaId") REFERENCES "LeagueArena"("id") ON DELETE SET NULL ON UPDATE CASCADE;
