import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { StripeModule } from '../stripe/stripe.module';
import { EmailModule } from '../email/email.module';
import { FileStorageModule } from '../file-storage/file-storage.module';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';

@Module({
  imports: [PrismaModule, StripeModule, EmailModule, FileStorageModule],
  controllers: [TournamentsController],
  providers: [TournamentsService],
  exports: [TournamentsService],
})
export class TournamentsModule {}
