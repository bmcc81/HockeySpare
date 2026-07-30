-- CreateTable
CREATE TABLE "MemberFee" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "userId" TEXT,
    "teamId" TEXT NOT NULL,
    "leagueId" TEXT,
    "season" TEXT NOT NULL,
    "amountOwed" INTEGER NOT NULL DEFAULT 0,
    "amountPaid" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberFee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemberFee_teamId_idx" ON "MemberFee"("teamId");

-- CreateIndex
CREATE INDEX "MemberFee_leagueId_idx" ON "MemberFee"("leagueId");

-- CreateIndex
CREATE INDEX "MemberFee_userId_idx" ON "MemberFee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberFee_memberId_season_key" ON "MemberFee"("memberId", "season");

-- AddForeignKey
ALTER TABLE "MemberFee" ADD CONSTRAINT "MemberFee_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberFee" ADD CONSTRAINT "MemberFee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberFee" ADD CONSTRAINT "MemberFee_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberFee" ADD CONSTRAINT "MemberFee_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE SET NULL ON UPDATE CASCADE;
