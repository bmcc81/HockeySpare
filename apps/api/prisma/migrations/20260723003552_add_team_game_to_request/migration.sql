-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "teamGameId" TEXT;

-- CreateIndex
CREATE INDEX "Request_teamGameId_idx" ON "Request"("teamGameId");

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_teamGameId_fkey" FOREIGN KEY ("teamGameId") REFERENCES "TeamGame"("id") ON DELETE SET NULL ON UPDATE CASCADE;
