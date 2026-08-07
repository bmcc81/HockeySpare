-- CreateEnum
CREATE TYPE "TournamentRegistrationMode" AS ENUM ('OPEN', 'WAITLIST', 'CLOSED');

-- CreateEnum
CREATE TYPE "TournamentRegistrationStatus" AS ENUM ('CONFIRMED', 'WAITLISTED');

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "registrationMode" "TournamentRegistrationMode" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "registrationDeadline" TIMESTAMP(3),
ADD COLUMN     "registrationFeeCents" INTEGER,
ADD COLUMN     "stripeAccountId" TEXT,
ADD COLUMN     "stripePayoutsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TournamentRegistration" ADD COLUMN     "status" "TournamentRegistrationStatus" NOT NULL DEFAULT 'CONFIRMED';

-- CreateTable
CREATE TABLE "TournamentPayment" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_stripeAccountId_key" ON "Tournament"("stripeAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentPayment_stripeCheckoutSessionId_key" ON "TournamentPayment"("stripeCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentPayment_stripePaymentIntentId_key" ON "TournamentPayment"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "TournamentPayment_tournamentId_idx" ON "TournamentPayment"("tournamentId");

-- CreateIndex
CREATE INDEX "TournamentPayment_registrationId_idx" ON "TournamentPayment"("registrationId");

-- AddForeignKey
ALTER TABLE "TournamentPayment" ADD CONSTRAINT "TournamentPayment_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentPayment" ADD CONSTRAINT "TournamentPayment_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "TournamentRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
