-- CreateEnum
CREATE TYPE "TeamMemberType" AS ENUM ('REGULAR', 'SPARE');

-- CreateEnum
CREATE TYPE "TeamGameInviteStatus" AS ENUM ('PENDING', 'SENT', 'CONFIRMED', 'DECLINED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'TEAM_GAME_REMINDER';

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT,
    "displayName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "position" "Position",
    "memberType" "TeamMemberType" NOT NULL,
    "notifyByApp" BOOLEAN NOT NULL DEFAULT true,
    "notifyByEmail" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamGame" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "arena" TEXT,
    "opponent" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamGameInvite" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "status" "TeamGameInviteStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamGameInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_ownerId_key" ON "Team"("ownerId");

-- CreateIndex
CREATE INDEX "TeamMember_teamId_memberType_idx" ON "TeamMember"("teamId", "memberType");

-- CreateIndex
CREATE INDEX "TeamGame_teamId_startsAt_idx" ON "TeamGame"("teamId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "TeamGameInvite_gameId_memberId_key" ON "TeamGameInvite"("gameId", "memberId");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamGame" ADD CONSTRAINT "TeamGame_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamGameInvite" ADD CONSTRAINT "TeamGameInvite_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "TeamGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamGameInvite" ADD CONSTRAINT "TeamGameInvite_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
