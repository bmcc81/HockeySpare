-- CreateTable
CREATE TABLE "LeagueArena" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeagueArena_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeagueArena_leagueId_idx" ON "LeagueArena"("leagueId");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueArena_leagueId_name_key" ON "LeagueArena"("leagueId", "name");

-- AddForeignKey
ALTER TABLE "LeagueArena" ADD CONSTRAINT "LeagueArena_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;
