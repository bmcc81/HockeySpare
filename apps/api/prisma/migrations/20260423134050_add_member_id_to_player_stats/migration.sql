-- AlterTable
ALTER TABLE "PlayerStat" ADD COLUMN     "memberId" TEXT;

-- CreateIndex
CREATE INDEX "PlayerStat_memberId_idx" ON "PlayerStat"("memberId");

-- AddForeignKey
ALTER TABLE "PlayerStat" ADD CONSTRAINT "PlayerStat_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
