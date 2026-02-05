import { Module } from '@nestjs/common';
import { PlayerOffersController } from './player-offers.controller';
import { PlayerOffersService } from './player-offers.service';

@Module({
  controllers: [PlayerOffersController],
  providers: [PlayerOffersService],
})
export class PlayerOffersModule {}