import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { StripeModule } from '../stripe/stripe.module';
import { EmailModule } from '../email/email.module';
import { FileStorageModule } from '../file-storage/file-storage.module';
import { AiModule } from '../../ai/ai.module';
import { TournamentsController } from './tournaments.controller';
import { TournamentsPublicApiController } from './tournaments-public-api.controller';
import { TournamentsService } from './tournaments.service';
import { ApiKeyGuard } from './api-key.guard';

@Module({
  imports: [
    PrismaModule,
    StripeModule,
    EmailModule,
    FileStorageModule,
    AiModule,
  ],
  controllers: [TournamentsController, TournamentsPublicApiController],
  providers: [TournamentsService, ApiKeyGuard],
  exports: [TournamentsService],
})
export class TournamentsModule {}
