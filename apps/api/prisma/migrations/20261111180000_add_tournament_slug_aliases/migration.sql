-- CreateTable
-- IF NOT EXISTS: this table may already have been created by hand on the Pi
-- (Prisma migrations are applied manually there), so re-running is harmless.
CREATE TABLE IF NOT EXISTS "TournamentSlugAlias" (
    "slug" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentSlugAlias_pkey" PRIMARY KEY ("slug")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TournamentSlugAlias_tournamentId_idx" ON "TournamentSlugAlias"("tournamentId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'TournamentSlugAlias_tournamentId_fkey'
    ) THEN
        ALTER TABLE "TournamentSlugAlias"
            ADD CONSTRAINT "TournamentSlugAlias_tournamentId_fkey"
            FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
