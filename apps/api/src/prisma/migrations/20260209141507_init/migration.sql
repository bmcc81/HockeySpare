-- CreateEnum
CREATE TYPE "Position" AS ENUM ('LW', 'C', 'RW', 'LD', 'RD', 'G');

-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ELITE');

-- CreateTable
CREATE TABLE "Request" (
    "id" UUID NOT NULL,
    "arena" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "payCents" INTEGER,
    "notes" TEXT,
    "position" "Position" NOT NULL,
    "skill" "SkillLevel" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerOffer" (
    "id" UUID NOT NULL,
    "arena" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "payCents" INTEGER,
    "notes" TEXT,
    "position" "Position" NOT NULL,
    "skill" "SkillLevel" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Request_startsAt_idx" ON "Request"("startsAt");

-- CreateIndex
CREATE INDEX "Request_position_skill_idx" ON "Request"("position", "skill");

-- CreateIndex
CREATE INDEX "PlayerOffer_startsAt_idx" ON "PlayerOffer"("startsAt");

-- CreateIndex
CREATE INDEX "PlayerOffer_position_skill_idx" ON "PlayerOffer"("position", "skill");
