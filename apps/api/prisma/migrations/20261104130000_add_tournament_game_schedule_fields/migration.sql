-- CreateEnum
CREATE TYPE "TournamentGameStage" AS ENUM ('ROUND_ROBIN', 'PLAYOFF', 'EXHIBITION', 'EVENT');

-- AlterTable
ALTER TABLE "TournamentGame" ADD COLUMN     "gameNumber" TEXT,
ADD COLUMN     "division" TEXT,
ADD COLUMN     "stage" "TournamentGameStage" NOT NULL DEFAULT 'ROUND_ROBIN';
