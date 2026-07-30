import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { RequestsModule } from './modules/requests/requests.module';
import { PlayerOffersModule } from './modules/player-offers/player-offers.module';
import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { TeamsModule } from './modules/teams/teams.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { EmailModule } from './email/email.module';
import { LeaguesModule } from './leagues/leagues.module';
import { ScoreSheetsModule } from './modules/score-sheets/score-sheets.module';
import { AiModule } from './ai/ai.module';
import { TournamentsModule } from './modules/tournaments/tournaments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    ScoreSheetsModule,
    PrismaModule,
    RequestsModule,
    PlayerOffersModule,
    NotificationsModule,
    TeamsModule,
    BookingsModule,
    EmailModule,
    LeaguesModule,
    AiModule,
    TournamentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
