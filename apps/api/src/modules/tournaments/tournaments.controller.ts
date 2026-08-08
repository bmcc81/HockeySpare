import {
  BadRequestException,
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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
import { AddTournamentCoOrganizerDto } from './dto/add-tournament-co-organizer.dto';
import { CreateTournamentTeamDto } from './dto/create-tournament-team.dto';
import { UpdateTournamentTeamDto } from './dto/update-tournament-team.dto';
import { CreateTournamentTeamPlayerDto } from './dto/create-tournament-team-player.dto';
import { UpsertTournamentGamePlayerStatDto } from './dto/upsert-tournament-game-player-stat.dto';
import { CreateTournamentBracketDto } from './dto/create-tournament-bracket.dto';
import { ScheduleBracketMatchGameDto } from './dto/schedule-bracket-match-game.dto';
import { CreateTournamentApiKeyDto } from './dto/create-tournament-api-key.dto';
import { CreateTournamentWebhookDto } from './dto/create-tournament-webhook.dto';
import { CreateTournamentRefereeDto } from './dto/create-tournament-referee.dto';
import { AssignTournamentGameRefereeDto } from './dto/assign-tournament-game-referee.dto';
import { CreateTournamentVolunteerShiftDto } from './dto/create-tournament-volunteer-shift.dto';
import { CreateTournamentVolunteerSignupDto } from './dto/create-tournament-volunteer-signup.dto';
import { CreateTournamentInfoListingDto } from './dto/create-tournament-info-listing.dto';
import { UpdateTournamentInfoListingDto } from './dto/update-tournament-info-listing.dto';
import { CreateTournamentLostFoundItemDto } from './dto/create-tournament-lost-found-item.dto';
import { UpdateTournamentLostFoundItemDto } from './dto/update-tournament-lost-found-item.dto';

type AuthRequest = {
  user?: {
    id?: string;
    sub?: string;
  };
};

const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_PDF_UPLOAD_BYTES = 20 * 1024 * 1024;

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

  @UseGuards(JwtAuthGuard)
  @Get(':id/co-organizers')
  listCoOrganizers(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.tournamentsService.listCoOrganizers(this.getUserId(req), id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/co-organizers')
  addCoOrganizer(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: AddTournamentCoOrganizerDto,
  ) {
    return this.tournamentsService.addCoOrganizer(
      this.getUserId(req),
      id,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/co-organizers/:coOrganizerId')
  removeCoOrganizer(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('coOrganizerId') coOrganizerId: string,
  ) {
    return this.tournamentsService.removeCoOrganizer(
      this.getUserId(req),
      id,
      coOrganizerId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/audit-log')
  listAuditLog(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.tournamentsService.listAuditLog(this.getUserId(req), id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/payments')
  listPayments(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.tournamentsService.listPayments(this.getUserId(req), id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/file-storage/status')
  getFileStorageStatus() {
    return this.tournamentsService.getFileStorageStatus();
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/logo')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_UPLOAD_BYTES } }),
  )
  uploadLogo(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    return this.tournamentsService.uploadLogo(this.getUserId(req), id, file);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/rulebook')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_PDF_UPLOAD_BYTES } }),
  )
  uploadRulebook(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    return this.tournamentsService.uploadRulebook(
      this.getUserId(req),
      id,
      file,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/media')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_UPLOAD_BYTES } }),
  )
  addMediaAsset(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body('caption') caption?: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    return this.tournamentsService.addMediaAsset(
      this.getUserId(req),
      id,
      file,
      caption,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/media/:assetId')
  deleteMediaAsset(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('assetId') assetId: string,
  ) {
    return this.tournamentsService.deleteMediaAsset(
      this.getUserId(req),
      id,
      assetId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/api-keys')
  listApiKeys(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.tournamentsService.listApiKeys(this.getUserId(req), id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/api-keys')
  createApiKey(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: CreateTournamentApiKeyDto,
  ) {
    return this.tournamentsService.createApiKey(this.getUserId(req), id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/api-keys/:keyId')
  revokeApiKey(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('keyId') keyId: string,
  ) {
    return this.tournamentsService.revokeApiKey(
      this.getUserId(req),
      id,
      keyId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/webhooks')
  listWebhooks(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.tournamentsService.listWebhooks(this.getUserId(req), id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/webhooks')
  createWebhook(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: CreateTournamentWebhookDto,
  ) {
    return this.tournamentsService.createWebhook(
      this.getUserId(req),
      id,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/webhooks/:webhookId')
  deleteWebhook(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('webhookId') webhookId: string,
  ) {
    return this.tournamentsService.deleteWebhook(
      this.getUserId(req),
      id,
      webhookId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/scoresheet-ocr/status')
  getScoresheetOcrStatus() {
    return this.tournamentsService.getScoresheetOcrStatus();
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/games/:gameId/scoresheet-ocr')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_UPLOAD_BYTES } }),
  )
  scanScoresheet(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('gameId') gameId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    return this.tournamentsService.scanScoresheet(
      this.getUserId(req),
      id,
      gameId,
      file,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/referees')
  listReferees(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.tournamentsService.listReferees(this.getUserId(req), id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/referees')
  createReferee(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: CreateTournamentRefereeDto,
  ) {
    return this.tournamentsService.createReferee(this.getUserId(req), id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/referees/:refereeId')
  deleteReferee(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('refereeId') refereeId: string,
  ) {
    return this.tournamentsService.deleteReferee(
      this.getUserId(req),
      id,
      refereeId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/games/:gameId/referees')
  assignRefereeToGame(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('gameId') gameId: string,
    @Body() dto: AssignTournamentGameRefereeDto,
  ) {
    return this.tournamentsService.assignRefereeToGame(
      this.getUserId(req),
      id,
      gameId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/games/:gameId/referees/:assignmentId')
  unassignRefereeFromGame(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('gameId') gameId: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.tournamentsService.unassignRefereeFromGame(
      this.getUserId(req),
      id,
      gameId,
      assignmentId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/volunteer-shifts')
  createVolunteerShift(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: CreateTournamentVolunteerShiftDto,
  ) {
    return this.tournamentsService.createVolunteerShift(
      this.getUserId(req),
      id,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/volunteer-shifts/:shiftId')
  deleteVolunteerShift(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('shiftId') shiftId: string,
  ) {
    return this.tournamentsService.deleteVolunteerShift(
      this.getUserId(req),
      id,
      shiftId,
    );
  }

  // Public - anyone with the link can sign up for a volunteer shift.
  @Post(':id/volunteer-shifts/:shiftId/signups')
  signUpForVolunteerShift(
    @Param('id') id: string,
    @Param('shiftId') shiftId: string,
    @Body() dto: CreateTournamentVolunteerSignupDto,
  ) {
    return this.tournamentsService.signUpForVolunteerShift(id, shiftId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/volunteer-shifts/:shiftId/signups')
  listVolunteerSignups(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('shiftId') shiftId: string,
  ) {
    return this.tournamentsService.listVolunteerSignups(
      this.getUserId(req),
      id,
      shiftId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/info-listings')
  createInfoListing(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: CreateTournamentInfoListingDto,
  ) {
    return this.tournamentsService.createInfoListing(
      this.getUserId(req),
      id,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/info-listings/:listingId')
  updateInfoListing(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('listingId') listingId: string,
    @Body() dto: UpdateTournamentInfoListingDto,
  ) {
    return this.tournamentsService.updateInfoListing(
      this.getUserId(req),
      id,
      listingId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/info-listings/:listingId')
  deleteInfoListing(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('listingId') listingId: string,
  ) {
    return this.tournamentsService.deleteInfoListing(
      this.getUserId(req),
      id,
      listingId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/lost-found')
  createLostFoundItem(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: CreateTournamentLostFoundItemDto,
  ) {
    return this.tournamentsService.createLostFoundItem(
      this.getUserId(req),
      id,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/lost-found/:itemId')
  updateLostFoundItem(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateTournamentLostFoundItemDto,
  ) {
    return this.tournamentsService.updateLostFoundItem(
      this.getUserId(req),
      id,
      itemId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/lost-found/:itemId')
  deleteLostFoundItem(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    return this.tournamentsService.deleteLostFoundItem(
      this.getUserId(req),
      id,
      itemId,
    );
  }
}
