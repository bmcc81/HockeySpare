import { Body, Controller, Get, Post, Param, ParseIntPipe, Req, UseGuards } from '@nestjs/common';
import { PlayerOffersService } from './player-offers.service';
import { CreatePlayerOfferDto } from './dto/create-player-offer.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

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

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Req() req: any, @Body() dto: CreatePlayerOfferDto) {
    return this.service.create(req.user.id, dto);
  }
}