import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
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
import { CreateLeagueArenaDto } from './dto/create-league-arena.dto';
import { AddLeagueTeamMemberDto } from './dto/add-league-team-member.dto';
import { BulkAddLeagueTeamMembersDto } from './dto/bulk-add-league-team-members.dto';
import { UpdateLeagueTeamMemberRoleDto } from './dto/update-league-team-member-role.dto';

type AuthRequest = {
  user?: {
    id?: string;
    sub?: string;
    email?: string;
    role: 'PLAYER' | 'CAPTAIN' | 'GENERAL_MANAGER';
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

  @Get(':id/standings')
  getStandings(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.leaguesService.getStandings(this.getUserId(req), id);
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

  @Delete(':leagueId/teams/:teamId/games/:gameId')
  deleteGame(
    @Req() req: any,
    @Param('leagueId') leagueId: string,
    @Param('teamId') teamId: string,
    @Param('gameId') gameId: string,
  ) {
    return this.leaguesService.deleteGame(
      this.getUserId(req),
      leagueId,
      teamId,
      gameId,
    );
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

  @Post(':leagueId/arenas')
  addArena(
    @Req() req: any,
    @Param('leagueId') leagueId: string,
    @Body() dto: CreateLeagueArenaDto,
  ) {
    return this.leaguesService.addArena(this.getUserId(req), leagueId, dto);
  }

  @Delete(':leagueId/arenas/:arenaId')
  deleteArena(
    @Req() req: AuthRequest,
    @Param('leagueId') leagueId: string,
    @Param('arenaId') arenaId: string,
  ) {
    return this.leaguesService.deleteArena(
      this.getUserId(req),
      leagueId,
      arenaId,
    );
  }

  @Post(':leagueId/teams/:teamId/members')
  @UseGuards(JwtAuthGuard)
  addMemberToLeagueTeam(
    @Req() req: any,
    @Param('leagueId') leagueId: string,
    @Param('teamId') teamId: string,
    @Body() dto: AddLeagueTeamMemberDto,
  ) {
    return this.leaguesService.addMemberToLeagueTeam(
      this.getUserId(req),
      leagueId,
      teamId,
      dto,
    );
  }

  @Post(':leagueId/teams/:teamId/members/bulk')
  @UseGuards(JwtAuthGuard)
  bulkAddMembersToLeagueTeam(
    @Req() req: any,
    @Param('leagueId') leagueId: string,
    @Param('teamId') teamId: string,
    @Body() dto: BulkAddLeagueTeamMembersDto,
  ) {
    return this.leaguesService.bulkAddMembersToLeagueTeam(
      this.getUserId(req),
      leagueId,
      teamId,
      dto.members,
    );
  }

  @Delete(':id/teams/:teamId/members/:memberId')
  @UseGuards(JwtAuthGuard)
  removeMemberFromLeagueTeam(
    @Req() req: any,
    @Param('id') leagueId: string,
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.leaguesService.removeMemberFromLeagueTeam(
      req.user.sub,
      leagueId,
      teamId,
      memberId,
    );
  }

  @Patch(':id/teams/:teamId/members/:memberId/role')
  @UseGuards(JwtAuthGuard)
  updateLeagueTeamMemberRole(
    @Req() req: any,
    @Param('id') leagueId: string,
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateLeagueTeamMemberRoleDto,
  ) {
    return this.leaguesService.updateLeagueTeamMemberRole(
      req.user.sub,
      leagueId,
      teamId,
      memberId,
      dto.role,
    );
  }
}
