import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PlayerOffersController } from './player-offers.controller';
import { PlayerOffersService } from './player-offers.service';

@Module({
  imports: [PrismaModule],
  controllers: [PlayerOffersController],
  providers: [PlayerOffersService],
})
export class PlayerOffersModule {}