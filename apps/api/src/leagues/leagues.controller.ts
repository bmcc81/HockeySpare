import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LeaguesService } from './leagues.service';
import { CreateLeagueDto } from './dto/create-league.dto';
import { CreateLeagueTeamDto } from './dto/create-league-team.dto';
import { CreateLeagueGameDto } from './dto/create-league-game.dto';

type AuthRequest = {
  user?: {
    id?: string;
    sub?: string;
    email?: string;
  };
};

@Controller('leagues')
@UseGuards(JwtAuthGuard)
export class LeaguesController {
  constructor(private readonly leaguesService: LeaguesService) {}

  @Get()
  list(@Req() req: AuthRequest) {
    return this.leaguesService.listForUser(this.getUserId(req));
  }

  @Post()
  create(@Req() req: AuthRequest, @Body() dto: CreateLeagueDto) {
    return this.leaguesService.create(this.getUserId(req), dto);
  }

  @Get(':id')
  getById(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.leaguesService.getById(this.getUserId(req), id);
  }

  @Get(':id/teams')
  listTeams(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.leaguesService.listTeams(this.getUserId(req), id);
  }

  @Post(':id/teams')
  addTeam(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: CreateLeagueTeamDto,
  ) {
    return this.leaguesService.addTeam(this.getUserId(req), id, dto);
  }

  @Get(':id/games')
  listGames(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.leaguesService.listGames(this.getUserId(req), id);
  }

  @Post(':id/teams/:teamId/games')
  addGame(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('teamId') teamId: string,
    @Body() dto: CreateLeagueGameDto,
  ) {
    return this.leaguesService.addGame(this.getUserId(req), id, teamId, dto);
  }

  @Post(':id/teams/link-my-team')
  linkMyTeamToLeague(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.leaguesService.linkMyTeamToLeague(id, this.getUserId(req));
  }

  private getUserId(req: AuthRequest): string {
    const userId = req.user?.id ?? req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException('Missing authenticated user');
    }

    return userId;
  }
}
