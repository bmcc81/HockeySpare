import { Controller, Get, Module, Param } from '@nestjs/common';
import { PlayerHighlightsService } from './player-highlights.service';

@Controller('player-highlights')
export class PlayerHighlightsController {
  constructor(private readonly highlights: PlayerHighlightsService) {}

  @Get()
  home() {
    return this.highlights.tournaments();
  }

  @Get('tournaments/:id')
  tournament(@Param('id') id: string) {
    return this.highlights.tournaments(id);
  }
}

@Module({
  controllers: [PlayerHighlightsController],
  providers: [PlayerHighlightsService],
  exports: [PlayerHighlightsService],
})
export class PlayerHighlightsModule {}
