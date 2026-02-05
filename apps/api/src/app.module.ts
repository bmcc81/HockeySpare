import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RequestsModule } from './modules/requests/requests.module';
import { PlayerOffersModule } from './modules/player-offers/player-offers.module';

@Module({
  imports: [RequestsModule, PlayerOffersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}