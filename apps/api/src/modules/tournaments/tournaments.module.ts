import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { StripeModule } from '../stripe/stripe.module';
import { EmailModule } from '../email/email.module';
import { FileStorageModule } from '../file-storage/file-storage.module';
import { AiModule } from '../../ai/ai.module';
import { TournamentsController } from './tournaments.controller';
import { TournamentsPublicApiController } from './tournaments-public-api.controller';
import { TournamentShareController } from './tournament-share.controller';
import { TournamentCalendarController } from './tournament-calendar.controller';
import { TournamentFollowController } from './follow/tournament-follow.controller';
import { TournamentFollowService } from './follow/tournament-follow.service';
import { FollowReminderScheduler } from './follow/follow-reminder.scheduler';
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
  controllers: [
    TournamentsController,
    TournamentsPublicApiController,
    TournamentShareController,
    TournamentCalendarController,
    TournamentFollowController,
  ],
  providers: [
    TournamentsService,
    ApiKeyGuard,
    TournamentFollowService,
    FollowReminderScheduler,
  ],
  exports: [TournamentsService],
})
export class TournamentsModule {}
