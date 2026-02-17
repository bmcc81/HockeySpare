import { Body, Controller, Get, Post, Param, ParseIntPipe } from '@nestjs/common';
import { PlayerOffersService } from './player-offers.service';
import { CreatePlayerOfferDto } from './dto/create-player-offer.dto';

@Controller('player-offers')
export class PlayerOffersController {
  constructor(private readonly service: PlayerOffersService) {}

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreatePlayerOfferDto) {
    return this.service.create(dto);
  }
}
