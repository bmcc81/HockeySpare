import { Module } from '@nestjs/common';
import { PlayerOffersController } from './player-offers.controller';
import { PlayerOffersService } from './player-offers.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [PlayerOffersController],
  providers: [PlayerOffersService],
  exports: [PlayerOffersService],
})
export class PlayerOffersModule {}