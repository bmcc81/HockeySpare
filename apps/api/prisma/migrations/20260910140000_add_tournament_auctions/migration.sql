-- CreateEnum
CREATE TYPE "AuctionStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "AuctionItemStatus" AS ENUM ('OPEN', 'CLOSED', 'PAID', 'FULFILLED', 'CANCELLED');

-- CreateTable
CREATE TABLE "TournamentAuction" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Silent Auction',
    "description" TEXT,
    "status" "AuctionStatus" NOT NULL DEFAULT 'DRAFT',
    "opensAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3),
    "antiSnipeMinutes" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentAuction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentAuctionItem" (
    "id" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "donorName" TEXT,
    "fairMarketValueCents" INTEGER,
    "startingBidCents" INTEGER NOT NULL DEFAULT 0,
    "minIncrementCents" INTEGER NOT NULL DEFAULT 500,
    "buyNowCents" INTEGER,
    "status" "AuctionItemStatus" NOT NULL DEFAULT 'OPEN',
    "closesAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "currentBidCents" INTEGER,
    "winningBidId" TEXT,
    "paymentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "fulfilledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentAuctionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentAuctionBidder" (
    "id" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "userId" TEXT,
    "claimToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentAuctionBidder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentAuctionBid" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "bidderId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentAuctionBid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentAuctionPayment" (
    "id" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "bidderId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentAuctionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TournamentAuction_tournamentId_key" ON "TournamentAuction"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentAuctionItem_winningBidId_key" ON "TournamentAuctionItem"("winningBidId");

-- CreateIndex
CREATE INDEX "TournamentAuctionItem_auctionId_status_idx" ON "TournamentAuctionItem"("auctionId", "status");

-- CreateIndex
CREATE INDEX "TournamentAuctionItem_paymentId_idx" ON "TournamentAuctionItem"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentAuctionBidder_claimToken_key" ON "TournamentAuctionBidder"("claimToken");

-- CreateIndex
CREATE INDEX "TournamentAuctionBidder_auctionId_idx" ON "TournamentAuctionBidder"("auctionId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentAuctionBidder_auctionId_email_key" ON "TournamentAuctionBidder"("auctionId", "email");

-- CreateIndex
CREATE INDEX "TournamentAuctionBid_itemId_amountCents_idx" ON "TournamentAuctionBid"("itemId", "amountCents");

-- CreateIndex
CREATE INDEX "TournamentAuctionBid_bidderId_idx" ON "TournamentAuctionBid"("bidderId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentAuctionPayment_stripeCheckoutSessionId_key" ON "TournamentAuctionPayment"("stripeCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentAuctionPayment_stripePaymentIntentId_key" ON "TournamentAuctionPayment"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "TournamentAuctionPayment_auctionId_idx" ON "TournamentAuctionPayment"("auctionId");

-- CreateIndex
CREATE INDEX "TournamentAuctionPayment_bidderId_idx" ON "TournamentAuctionPayment"("bidderId");

-- AddForeignKey
ALTER TABLE "TournamentAuction" ADD CONSTRAINT "TournamentAuction_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentAuctionItem" ADD CONSTRAINT "TournamentAuctionItem_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "TournamentAuction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentAuctionItem" ADD CONSTRAINT "TournamentAuctionItem_winningBidId_fkey" FOREIGN KEY ("winningBidId") REFERENCES "TournamentAuctionBid"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentAuctionItem" ADD CONSTRAINT "TournamentAuctionItem_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "TournamentAuctionPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentAuctionBidder" ADD CONSTRAINT "TournamentAuctionBidder_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "TournamentAuction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentAuctionBidder" ADD CONSTRAINT "TournamentAuctionBidder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentAuctionBid" ADD CONSTRAINT "TournamentAuctionBid_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "TournamentAuctionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentAuctionBid" ADD CONSTRAINT "TournamentAuctionBid_bidderId_fkey" FOREIGN KEY ("bidderId") REFERENCES "TournamentAuctionBidder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentAuctionPayment" ADD CONSTRAINT "TournamentAuctionPayment_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "TournamentAuction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentAuctionPayment" ADD CONSTRAINT "TournamentAuctionPayment_bidderId_fkey" FOREIGN KEY ("bidderId") REFERENCES "TournamentAuctionBidder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
