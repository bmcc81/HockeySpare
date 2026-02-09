import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { RequestsModule } from './modules/requests/requests.module';
import { PlayerOffersModule } from './modules/player-offers/player-offers.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // loads apps/api/.env
    PrismaModule,                             // provides PrismaService
    RequestsModule,
    PlayerOffersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
