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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    PrismaModule,
    RequestsModule,
    PlayerOffersModule,
    NotificationsModule,
    TeamsModule,
    BookingsModule,
    EmailModule,
  ],  
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}