import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { StripeModule } from '../stripe/stripe.module';
import { EmailModule } from '../email/email.module';
import { FileStorageModule } from '../file-storage/file-storage.module';
import { TournamentsModule } from '../tournaments/tournaments.module';
import { TournamentAuctionsController } from './tournament-auctions.controller';
import { TournamentAuctionsService } from './tournament-auctions.service';

@Module({
  imports: [
    PrismaModule,
    StripeModule,
    EmailModule,
    FileStorageModule,
    TournamentsModule,
  ],
  controllers: [TournamentAuctionsController],
  providers: [TournamentAuctionsService],
  exports: [TournamentAuctionsService],
})
export class TournamentAuctionsModule {}
