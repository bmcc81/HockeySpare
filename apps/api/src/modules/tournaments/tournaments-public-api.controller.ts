import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { TournamentsService } from './tournaments.service';

/**
 * The documented, key-authenticated public API (F017/Wave 6) - a stable
 * surface for third-party and AI workflows, separate from the internal
 * endpoints under /api/tournaments/* that the HockeySpare frontend itself
 * uses and which may change shape without notice.
 */
@UseGuards(ApiKeyGuard)
@Controller('v1/tournaments')
export class TournamentsPublicApiController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Get(':id')
  getTournament(@Param('id') id: string) {
    return this.tournamentsService.getPublic(id);
  }

  @Get(':id/standings')
  getStandings(
    @Param('id') id: string,
    @Query('division') division?: string,
  ) {
    return this.tournamentsService.getStandings(id, division);
  }

  @Get(':id/leaders')
  getLeaders(@Param('id') id: string) {
    return this.tournamentsService.getPlayerLeaders(id);
  }
}
