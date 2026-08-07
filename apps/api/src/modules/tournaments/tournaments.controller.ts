import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
  getStandings(@Param('id') id: string) {
    return this.tournamentsService.getStandings(id);
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
}
