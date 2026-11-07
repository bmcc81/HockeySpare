-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN "volunteersOpen" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "TournamentVolunteerSignup" ALTER COLUMN "email" DROP NOT NULL;
