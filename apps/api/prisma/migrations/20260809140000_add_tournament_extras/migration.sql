-- CreateEnum
CREATE TYPE "TournamentAnnouncementType" AS ENUM ('GENERAL', 'WEATHER');

-- CreateEnum
CREATE TYPE "TournamentInfoListingCategory" AS ENUM ('HOTEL', 'MERCHANDISE', 'VENDOR');

-- CreateEnum
CREATE TYPE "TournamentLostFoundStatus" AS ENUM ('UNCLAIMED', 'CLAIMED');

-- AlterTable
ALTER TABLE "TournamentAnnouncement" ADD COLUMN     "type" "TournamentAnnouncementType" NOT NULL DEFAULT 'GENERAL';

-- AlterTable
ALTER TABLE "TournamentGame" ADD COLUMN     "livestreamUrl" TEXT;

-- CreateTable
CREATE TABLE "TournamentReferee" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentReferee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentGameReferee" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "refereeId" TEXT NOT NULL,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentGameReferee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentVolunteerShift" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "capacity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentVolunteerShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentVolunteerSignup" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentVolunteerSignup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentInfoListing" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "category" "TournamentInfoListingCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentInfoListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentLostFoundItem" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "contactInfo" TEXT,
    "status" "TournamentLostFoundStatus" NOT NULL DEFAULT 'UNCLAIMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentLostFoundItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TournamentReferee_tournamentId_idx" ON "TournamentReferee"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentGameReferee_gameId_refereeId_key" ON "TournamentGameReferee"("gameId", "refereeId");

-- CreateIndex
CREATE INDEX "TournamentGameReferee_gameId_idx" ON "TournamentGameReferee"("gameId");

-- CreateIndex
CREATE INDEX "TournamentGameReferee_refereeId_idx" ON "TournamentGameReferee"("refereeId");

-- CreateIndex
CREATE INDEX "TournamentVolunteerShift_tournamentId_startsAt_idx" ON "TournamentVolunteerShift"("tournamentId", "startsAt");

-- CreateIndex
CREATE INDEX "TournamentVolunteerSignup_shiftId_idx" ON "TournamentVolunteerSignup"("shiftId");

-- CreateIndex
CREATE INDEX "TournamentInfoListing_tournamentId_category_idx" ON "TournamentInfoListing"("tournamentId", "category");

-- CreateIndex
CREATE INDEX "TournamentLostFoundItem_tournamentId_status_idx" ON "TournamentLostFoundItem"("tournamentId", "status");

-- AddForeignKey
ALTER TABLE "TournamentReferee" ADD CONSTRAINT "TournamentReferee_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentGameReferee" ADD CONSTRAINT "TournamentGameReferee_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "TournamentGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentGameReferee" ADD CONSTRAINT "TournamentGameReferee_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "TournamentReferee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentVolunteerShift" ADD CONSTRAINT "TournamentVolunteerShift_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentVolunteerSignup" ADD CONSTRAINT "TournamentVolunteerSignup_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "TournamentVolunteerShift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentInfoListing" ADD CONSTRAINT "TournamentInfoListing_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentLostFoundItem" ADD CONSTRAINT "TournamentLostFoundItem_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
