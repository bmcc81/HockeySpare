import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { CreateTournamentGameDto } from './dto/create-tournament-game.dto';
import { UpdateTournamentGameDto } from './dto/update-tournament-game.dto';
import { CreateTournamentRegistrationDto } from './dto/create-tournament-registration.dto';
import { UpdateTournamentRegistrationDto } from './dto/update-tournament-registration.dto';
import { CreateTournamentSponsorDto } from './dto/create-tournament-sponsor.dto';
import { UpdateTournamentSponsorDto } from './dto/update-tournament-sponsor.dto';
import { CreateTournamentAnnouncementDto } from './dto/create-tournament-announcement.dto';
import { CreateTournamentVenueDto } from './dto/create-tournament-venue.dto';
import { UpdateTournamentVenueDto } from './dto/update-tournament-venue.dto';
import { CreateTournamentTeamDto } from './dto/create-tournament-team.dto';
import { UpdateTournamentTeamDto } from './dto/update-tournament-team.dto';
import { CreateTournamentTeamPlayerDto } from './dto/create-tournament-team-player.dto';
import { UpsertTournamentGamePlayerStatDto } from './dto/upsert-tournament-game-player-stat.dto';
import { CreateTournamentBracketDto } from './dto/create-tournament-bracket.dto';
import { ScheduleBracketMatchGameDto } from './dto/schedule-bracket-match-game.dto';

type AuthRequest = {
  user?: {
    id?: string;
    sub?: string;
  };
};

@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  private getUserId(req: AuthRequest): string {
    const userId = req.user?.id ?? req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException('Authenticated user id not found');
    }

    return userId;
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: AuthRequest, @Body() dto: CreateTournamentDto) {
    return this.tournamentsService.create(this.getUserId(req), dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  listMine(@Req() req: AuthRequest) {
    return this.tournamentsService.listMine(this.getUserId(req));
  }

  // Public - no auth guard. Anyone with the link can view the schedule/rules.
  @Get(':id')
  getPublic(@Param('id') id: string) {
    return this.tournamentsService.getPublic(id);
  }

  // Public - same visibility as the schedule.
  @Get(':id/standings')
  getStandings(@Param('id') id: string, @Query('division') division?: string) {
    return this.tournamentsService.getStandings(id, division);
  }

  // Public - same visibility as the schedule.
  @Get(':id/leaders')
  getPlayerLeaders(@Param('id') id: string) {
    return this.tournamentsService.getPlayerLeaders(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateTournamentDto,
  ) {
    return this.tournamentsService.update(this.getUserId(req), id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/games')
  addGame(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: CreateTournamentGameDto,
  ) {
    return this.tournamentsService.addGame(this.getUserId(req), id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/games/:gameId')
  updateGame(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('gameId') gameId: string,
    @Body() dto: UpdateTournamentGameDto,
  ) {
    return this.tournamentsService.updateGame(
      this.getUserId(req),
      id,
      gameId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/games/:gameId')
  deleteGame(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('gameId') gameId: string,
  ) {
    return this.tournamentsService.deleteGame(this.getUserId(req), id, gameId);
  }

  // Public - no auth guard. Anyone with the link can submit a registration.
  @Post(':id/registrations')
  submitRegistration(
    @Param('id') id: string,
    @Body() dto: CreateTournamentRegistrationDto,
  ) {
    return this.tournamentsService.submitRegistration(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/registrations')
  listRegistrations(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.tournamentsService.listRegistrations(this.getUserId(req), id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/registrations/:registrationId')
  updateRegistration(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('registrationId') registrationId: string,
    @Body() dto: UpdateTournamentRegistrationDto,
  ) {
    return this.tournamentsService.updateRegistration(
      this.getUserId(req),
      id,
      registrationId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/registrations/:registrationId')
  deleteRegistration(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('registrationId') registrationId: string,
  ) {
    return this.tournamentsService.deleteRegistration(
      this.getUserId(req),
      id,
      registrationId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/sponsors')
  addSponsor(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: CreateTournamentSponsorDto,
  ) {
    return this.tournamentsService.addSponsor(this.getUserId(req), id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/sponsors/:sponsorId')
  updateSponsor(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('sponsorId') sponsorId: string,
    @Body() dto: UpdateTournamentSponsorDto,
  ) {
    return this.tournamentsService.updateSponsor(
      this.getUserId(req),
      id,
      sponsorId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/sponsors/:sponsorId')
  deleteSponsor(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('sponsorId') sponsorId: string,
  ) {
    return this.tournamentsService.deleteSponsor(
      this.getUserId(req),
      id,
      sponsorId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/payments/status')
  getPaymentsStatus(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.tournamentsService.getPaymentsStatus(this.getUserId(req), id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/payments/connect')
  connectStripeAccount(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.tournamentsService.connectStripeAccount(
      this.getUserId(req),
      id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/payments/refresh')
  refreshStripeAccountStatus(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.tournamentsService.refreshStripeAccountStatus(
      this.getUserId(req),
      id,
    );
  }

  // Public - lets a registrant retry payment if their first checkout was
  // abandoned. Knowing the registrationId is the same trust level as the
  // rest of the public registration flow.
  @Post(':id/registrations/:registrationId/checkout')
  retryRegistrationCheckout(
    @Param('id') id: string,
    @Param('registrationId') registrationId: string,
  ) {
    return this.tournamentsService.retryRegistrationCheckout(
      id,
      registrationId,
    );
  }

  // Public - the registrant lands here after Stripe Checkout redirects back.
  @Get(':id/payments/verify/:sessionId')
  verifyRegistrationCheckoutSession(@Param('sessionId') sessionId: string) {
    return this.tournamentsService.verifyRegistrationCheckoutSession(sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/teams')
  addTeam(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: CreateTournamentTeamDto,
  ) {
    return this.tournamentsService.addTeam(this.getUserId(req), id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/registrations/:registrationId/team')
  createTeamFromRegistration(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('registrationId') registrationId: string,
  ) {
    return this.tournamentsService.createTeamFromRegistration(
      this.getUserId(req),
      id,
      registrationId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/teams/:teamId')
  updateTeam(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('teamId') teamId: string,
    @Body() dto: UpdateTournamentTeamDto,
  ) {
    return this.tournamentsService.updateTeam(
      this.getUserId(req),
      id,
      teamId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/teams/:teamId')
  deleteTeam(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('teamId') teamId: string,
  ) {
    return this.tournamentsService.deleteTeam(this.getUserId(req), id, teamId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/teams/:teamId/players')
  addTeamPlayer(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('teamId') teamId: string,
    @Body() dto: CreateTournamentTeamPlayerDto,
  ) {
    return this.tournamentsService.addTeamPlayer(
      this.getUserId(req),
      id,
      teamId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/teams/:teamId/players/:playerId')
  removeTeamPlayer(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('teamId') teamId: string,
    @Param('playerId') playerId: string,
  ) {
    return this.tournamentsService.removeTeamPlayer(
      this.getUserId(req),
      id,
      teamId,
      playerId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/games/:gameId/stats')
  upsertGamePlayerStat(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('gameId') gameId: string,
    @Body() dto: UpsertTournamentGamePlayerStatDto,
  ) {
    return this.tournamentsService.upsertGamePlayerStat(
      this.getUserId(req),
      id,
      gameId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/games/:gameId/stats/:statId')
  deleteGamePlayerStat(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('gameId') gameId: string,
    @Param('statId') statId: string,
  ) {
    return this.tournamentsService.deleteGamePlayerStat(
      this.getUserId(req),
      id,
      gameId,
      statId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/brackets')
  createBracket(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: CreateTournamentBracketDto,
  ) {
    return this.tournamentsService.createBracket(this.getUserId(req), id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/brackets/:bracketId')
  deleteBracket(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('bracketId') bracketId: string,
  ) {
    return this.tournamentsService.deleteBracket(
      this.getUserId(req),
      id,
      bracketId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/brackets/:bracketId/matches/:matchId/game')
  scheduleMatchGame(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('bracketId') bracketId: string,
    @Param('matchId') matchId: string,
    @Body() dto: ScheduleBracketMatchGameDto,
  ) {
    return this.tournamentsService.scheduleMatchGame(
      this.getUserId(req),
      id,
      bracketId,
      matchId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/announcements')
  addAnnouncement(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: CreateTournamentAnnouncementDto,
  ) {
    return this.tournamentsService.addAnnouncement(
      this.getUserId(req),
      id,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/announcements/:announcementId')
  deleteAnnouncement(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('announcementId') announcementId: string,
  ) {
    return this.tournamentsService.deleteAnnouncement(
      this.getUserId(req),
      id,
      announcementId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/venues')
  addVenue(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: CreateTournamentVenueDto,
  ) {
    return this.tournamentsService.addVenue(this.getUserId(req), id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/venues/:venueId')
  updateVenue(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('venueId') venueId: string,
    @Body() dto: UpdateTournamentVenueDto,
  ) {
    return this.tournamentsService.updateVenue(
      this.getUserId(req),
      id,
      venueId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/venues/:venueId')
  deleteVenue(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('venueId') venueId: string,
  ) {
    return this.tournamentsService.deleteVenue(
      this.getUserId(req),
      id,
      venueId,
    );
  }
}
