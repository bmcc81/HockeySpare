import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { RequestsModule } from './modules/requests/requests.module';
import { PlayerOffersModule } from './modules/player-offers/player-offers.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({ isGlobal: true }), // loads apps/api/.env
    PrismaModule,                             // provides PrismaService
    RequestsModule,
    PlayerOffersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
