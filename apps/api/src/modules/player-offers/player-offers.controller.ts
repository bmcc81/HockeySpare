// apps/api/src/modules/player-offers/player-offers.controller.ts
import { Body, Controller, Get, Post } from '@nestjs/common';
import { PlayerOffersService } from './player-offers.service';

@Controller('player-offers')
export class PlayerOffersController {
  constructor(private readonly service: PlayerOffersService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() dto: any) {
    return this.service.create(dto);
  }
}
