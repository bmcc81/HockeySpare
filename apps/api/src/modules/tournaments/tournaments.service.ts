import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { CreateTournamentGameDto } from './dto/create-tournament-game.dto';
import { UpdateTournamentGameDto } from './dto/update-tournament-game.dto';
import { CreateTournamentRegistrationDto } from './dto/create-tournament-registration.dto';
import { UpdateTournamentRegistrationDto } from './dto/update-tournament-registration.dto';
import { CreateTournamentSponsorDto } from './dto/create-tournament-sponsor.dto';
import { CreateTournamentTeamDto } from './dto/create-tournament-team.dto';
import { UpdateTournamentTeamDto } from './dto/update-tournament-team.dto';
import { CreateTournamentTeamPlayerDto } from './dto/create-tournament-team-player.dto';
import { UpsertTournamentGamePlayerStatDto } from './dto/upsert-tournament-game-player-stat.dto';
import { CreateTournamentBracketDto } from './dto/create-tournament-bracket.dto';
import { ScheduleBracketMatchGameDto } from './dto/schedule-bracket-match-game.dto';
import { StripeService } from '../stripe/stripe.service';
import { EmailService } from '../email/email.service';
import type Stripe from 'stripe';

@Injectable()
export class TournamentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly emailService: EmailService,
  ) {}

  private readonly tournamentInclude = {
    games: {
      orderBy: {
        startsAt: 'asc' as const,
      },
      include: {
        playerStats: {
          include: {
            teamPlayer: true,
          },
        },
      },
    },
    sponsors: {
      orderBy: {
        createdAt: 'asc' as const,
      },
    },
    teams: {
      orderBy: {
        name: 'asc' as const,
      },
      include: {
        players: {
          orderBy: {
            displayName: 'asc' as const,
          },
        },
      },
    },
    brackets: {
      orderBy: {
        createdAt: 'asc' as const,
      },
      include: {
        matches: {
          orderBy: [{ round: 'asc' as const }, { position: 'asc' as const }],
          include: {
            team1: { select: { id: true, name: true } },
            team2: { select: { id: true, name: true } },
            winnerTeam: { select: { id: true, name: true } },
            game: {
              select: {
                id: true,
                status: true,
                homeScore: true,
                awayScore: true,
                startsAt: true,
              },
            },
          },
        },
      },
    },
  };

  private async getOwnedTournament(userId: string, tournamentId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: {
        id: tournamentId,
      },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    if (tournament.createdById !== userId) {
      throw new ForbiddenException(
        'Only the tournament creator can manage this tournament.',
      );
    }

    return tournament;
  }

  async create(userId: string, dto: CreateTournamentDto) {
    return this.prisma.tournament.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        rules: dto.rules?.trim() || null,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        leagueId: dto.leagueId || null,
        createdById: userId,
        registrationMode: dto.registrationMode ?? 'OPEN',
        registrationDeadline: dto.registrationDeadline
          ? new Date(dto.registrationDeadline)
          : null,
        registrationFeeCents: dto.registrationFeeCents ?? null,
      },
      include: this.tournamentInclude,
    });
  }

  async listMine(userId: string) {
    return this.prisma.tournament.findMany({
      where: {
        createdById: userId,
      },
      include: this.tournamentInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getPublic(tournamentId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: {
        id: tournamentId,
      },
      include: this.tournamentInclude,
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    return tournament;
  }

  async update(userId: string, tournamentId: string, dto: UpdateTournamentDto) {
    await this.getOwnedTournament(userId, tournamentId);

    return this.prisma.tournament.update({
      where: {
        id: tournamentId,
      },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() || null }
          : {}),
        ...(dto.rules !== undefined ? { rules: dto.rules.trim() || null } : {}),
        ...(dto.startDate !== undefined
          ? { startDate: dto.startDate ? new Date(dto.startDate) : null }
          : {}),
        ...(dto.endDate !== undefined
          ? { endDate: dto.endDate ? new Date(dto.endDate) : null }
          : {}),
        ...(dto.leagueId !== undefined
          ? { leagueId: dto.leagueId || null }
          : {}),
        ...(dto.registrationMode !== undefined
          ? { registrationMode: dto.registrationMode }
          : {}),
        ...(dto.registrationDeadline !== undefined
          ? {
              registrationDeadline: dto.registrationDeadline
                ? new Date(dto.registrationDeadline)
                : null,
            }
          : {}),
        ...(dto.registrationFeeCents !== undefined
          ? { registrationFeeCents: dto.registrationFeeCents ?? null }
          : {}),
      },
      include: this.tournamentInclude,
    });
  }

  /**
   * When a game is linked to a real TournamentTeam, that team's current
   * name is always the source of truth for homeTeamName/awayTeamName -
   * standings and the schedule keep grouping by name, so this keeps them
   * from silently drifting out of sync with a renamed team.
   */
  private async resolveTeamName(
    tournamentId: string,
    teamId: string,
  ): Promise<string> {
    const team = await this.prisma.tournamentTeam.findFirst({
      where: { id: teamId, tournamentId },
      select: { name: true },
    });

    if (!team) {
      throw new BadRequestException(
        'Selected team does not belong to this tournament.',
      );
    }

    return team.name;
  }

  async addGame(
    userId: string,
    tournamentId: string,
    dto: CreateTournamentGameDto,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const homeTeamName = dto.homeTeamId
      ? await this.resolveTeamName(tournamentId, dto.homeTeamId)
      : dto.homeTeamName.trim();

    const awayTeamName = dto.awayTeamId
      ? await this.resolveTeamName(tournamentId, dto.awayTeamId)
      : dto.awayTeamName.trim();

    return this.prisma.tournamentGame.create({
      data: {
        tournamentId,
        homeTeamName,
        awayTeamName,
        homeTeamId: dto.homeTeamId || null,
        awayTeamId: dto.awayTeamId || null,
        startsAt: new Date(dto.startsAt),
        arenaName: dto.arenaName?.trim() || null,
        notes: dto.notes?.trim() || null,
      },
    });
  }

  async updateGame(
    userId: string,
    tournamentId: string,
    gameId: string,
    dto: UpdateTournamentGameDto,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const game = await this.prisma.tournamentGame.findFirst({
      where: {
        id: gameId,
        tournamentId,
      },
    });

    if (!game) {
      throw new NotFoundException('Tournament game not found');
    }

    const homeTeamName =
      dto.homeTeamId !== undefined && dto.homeTeamId
        ? await this.resolveTeamName(tournamentId, dto.homeTeamId)
        : dto.homeTeamName?.trim();

    const awayTeamName =
      dto.awayTeamId !== undefined && dto.awayTeamId
        ? await this.resolveTeamName(tournamentId, dto.awayTeamId)
        : dto.awayTeamName?.trim();

    const resultingStatus = dto.status ?? game.status;
    const resultingHomeScore =
      dto.homeScore !== undefined ? dto.homeScore : game.homeScore;
    const resultingAwayScore =
      dto.awayScore !== undefined ? dto.awayScore : game.awayScore;

    if (
      resultingStatus === 'FINAL' &&
      resultingHomeScore != null &&
      resultingAwayScore != null &&
      resultingHomeScore === resultingAwayScore
    ) {
      const bracketMatch = await this.prisma.tournamentBracketMatch.findUnique(
        {
          where: { gameId },
          select: { id: true },
        },
      );

      if (bracketMatch) {
        throw new BadRequestException(
          'Playoff games cannot end in a tie. Enter the final score including any overtime/shootout winner before marking this game final.',
        );
      }
    }

    const updatedGame = await this.prisma.tournamentGame.update({
      where: {
        id: gameId,
      },
      data: {
        ...(homeTeamName !== undefined ? { homeTeamName } : {}),
        ...(awayTeamName !== undefined ? { awayTeamName } : {}),
        ...(dto.homeTeamId !== undefined
          ? { homeTeamId: dto.homeTeamId || null }
          : {}),
        ...(dto.awayTeamId !== undefined
          ? { awayTeamId: dto.awayTeamId || null }
          : {}),
        ...(dto.startsAt !== undefined
          ? { startsAt: new Date(dto.startsAt) }
          : {}),
        ...(dto.arenaName !== undefined
          ? { arenaName: dto.arenaName.trim() || null }
          : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes.trim() || null } : {}),
        ...(dto.homeScore !== undefined ? { homeScore: dto.homeScore } : {}),
        ...(dto.awayScore !== undefined ? { awayScore: dto.awayScore } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });

    if (updatedGame.status === 'FINAL') {
      await this.advanceBracketIfNeeded(updatedGame.id);
    }

    return updatedGame;
  }

  /**
   * When a game linked to a bracket match reaches FINAL, propagate the
   * winner into that match's next-round slot. Ties on playoff games are
   * already rejected before this point (see updateGame), so a decisive
   * score is guaranteed here.
   */
  private async advanceBracketIfNeeded(gameId: string) {
    const match = await this.prisma.tournamentBracketMatch.findUnique({
      where: { gameId },
      include: { game: true },
    });

    if (!match || !match.game) {
      return;
    }

    const { game } = match;

    if (
      game.status !== 'FINAL' ||
      game.homeScore == null ||
      game.awayScore == null ||
      game.homeScore === game.awayScore
    ) {
      return;
    }

    const winnerTeamId =
      game.homeScore > game.awayScore ? game.homeTeamId : game.awayTeamId;

    if (!winnerTeamId) {
      return;
    }

    await this.prisma.tournamentBracketMatch.update({
      where: { id: match.id },
      data: { winnerTeamId },
    });

    if (match.nextMatchId && match.nextMatchSlot) {
      await this.prisma.tournamentBracketMatch.update({
        where: { id: match.nextMatchId },
        data:
          match.nextMatchSlot === 1
            ? { team1Id: winnerTeamId }
            : { team2Id: winnerTeamId },
      });
    }
  }

  async deleteGame(userId: string, tournamentId: string, gameId: string) {
    await this.getOwnedTournament(userId, tournamentId);

    const game = await this.prisma.tournamentGame.findFirst({
      where: {
        id: gameId,
        tournamentId,
      },
    });

    if (!game) {
      throw new NotFoundException('Tournament game not found');
    }

    await this.prisma.tournamentGame.delete({
      where: {
        id: gameId,
      },
    });

    return {
      id: game.id,
      deleted: true,
    };
  }

  // Public - no ownership check. Anyone with the tournament link can submit
  // a registration; only the creator can view/manage the submitted list.
  async submitRegistration(
    tournamentId: string,
    dto: CreateTournamentRegistrationDto,
  ) {
    const tournament = await this.prisma.tournament.findUnique({
      where: {
        id: tournamentId,
      },
      select: {
        id: true,
        name: true,
        registrationMode: true,
        registrationDeadline: true,
        registrationFeeCents: true,
        stripeAccountId: true,
        stripePayoutsEnabled: true,
      },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    if (tournament.registrationMode === 'CLOSED') {
      throw new BadRequestException(
        'Registration is closed for this tournament.',
      );
    }

    if (
      tournament.registrationDeadline &&
      new Date() > tournament.registrationDeadline
    ) {
      throw new BadRequestException(
        'The registration deadline for this tournament has passed.',
      );
    }

    const registration = await this.prisma.tournamentRegistration.create({
      data: {
        tournamentId,
        teamName: dto.teamName.trim(),
        division: dto.division?.trim() || null,
        contactName: dto.contactName.trim(),
        contactEmail: dto.contactEmail.trim().toLowerCase(),
        contactPhone: dto.contactPhone?.trim() || null,
        notes: dto.notes?.trim() || null,
        status:
          tournament.registrationMode === 'WAITLIST'
            ? 'WAITLISTED'
            : 'CONFIRMED',
      },
    });

    const feeApplies =
      !!tournament.registrationFeeCents &&
      tournament.registrationFeeCents > 0 &&
      tournament.stripeAccountId &&
      tournament.stripePayoutsEnabled;

    this.sendRegistrationReceivedEmail({
      tournamentName: tournament.name,
      registration,
      waitlisted: registration.status === 'WAITLISTED',
      feeCents: feeApplies ? tournament.registrationFeeCents : null,
    }).catch((err) => {
      console.warn('Registration confirmation email failed', err);
    });

    if (!feeApplies) {
      return { registration, checkoutUrl: null };
    }

    const checkoutUrl = await this.createRegistrationCheckoutSession(
      tournament as {
        id: string;
        name: string;
        registrationFeeCents: number;
        stripeAccountId: string;
      },
      registration,
    );

    return { registration, checkoutUrl };
  }

  private async createRegistrationCheckoutSession(
    tournament: {
      id: string;
      name: string;
      registrationFeeCents: number;
      stripeAccountId: string;
    },
    registration: { id: string; teamName: string; contactEmail: string },
  ): Promise<string> {
    const returnBase = `${this.appUrl()}/tournaments/${tournament.id}`;

    const session = await this.stripeService
      .getClient()
      .checkout.sessions.create(
        {
          mode: 'payment',
          payment_method_types: ['card'],
          customer_email: registration.contactEmail,
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: 'usd',
                unit_amount: tournament.registrationFeeCents,
                product_data: {
                  name: `${tournament.name} - registration fee`,
                  description: `Registration fee for ${registration.teamName}`,
                },
              },
            },
          ],
          success_url: `${returnBase}?paymentSessionId={CHECKOUT_SESSION_ID}`,
          cancel_url: returnBase,
          metadata: {
            type: 'tournament_registration',
            registrationId: registration.id,
          },
        },
        {
          stripeAccount: tournament.stripeAccountId,
        },
      );

    await this.prisma.tournamentPayment.create({
      data: {
        tournamentId: tournament.id,
        registrationId: registration.id,
        amountCents: tournament.registrationFeeCents,
        status: 'PENDING',
        stripeCheckoutSessionId: session.id,
      },
    });

    return session.url!;
  }

  // Public - the registrant themselves pays; knowing the registrationId
  // (returned right after they submitted) is the same trust level as the
  // rest of the public registration flow.
  async retryRegistrationCheckout(
    tournamentId: string,
    registrationId: string,
  ) {
    const tournament = await this.prisma.tournament.findUnique({
      where: {
        id: tournamentId,
      },
      select: {
        id: true,
        name: true,
        registrationFeeCents: true,
        stripeAccountId: true,
        stripePayoutsEnabled: true,
      },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    if (
      !tournament.registrationFeeCents ||
      tournament.registrationFeeCents <= 0 ||
      !tournament.stripeAccountId ||
      !tournament.stripePayoutsEnabled
    ) {
      throw new BadRequestException(
        'This tournament is not accepting registration payments.',
      );
    }

    const registration = await this.prisma.tournamentRegistration.findFirst({
      where: {
        id: registrationId,
        tournamentId,
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    const checkoutUrl = await this.createRegistrationCheckoutSession(
      tournament as {
        id: string;
        name: string;
        registrationFeeCents: number;
        stripeAccountId: string;
      },
      registration,
    );

    return { checkoutUrl };
  }

  // Public - same trust model as submitting a registration.
  async verifyRegistrationCheckoutSession(sessionId: string) {
    const payment = await this.prisma.tournamentPayment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: {
        registration: true,
        tournament: {
          select: { stripeAccountId: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment session not found.');
    }

    if (payment.status === 'SUCCEEDED') {
      return { status: payment.status, registration: payment.registration };
    }

    if (!payment.tournament.stripeAccountId) {
      throw new BadRequestException('This tournament is no longer connected.');
    }

    const session = await this.stripeService
      .getClient()
      .checkout.sessions.retrieve(
        payment.stripeCheckoutSessionId!,
        {},
        { stripeAccount: payment.tournament.stripeAccountId },
      );

    if (session.payment_status === 'paid') {
      const result = await this.claimRegistrationPaymentSuccess(
        payment.id,
        session,
      );

      return { status: 'SUCCEEDED', registration: result.registration };
    }

    return { status: payment.status, registration: payment.registration };
  }

  /**
   * Atomically transitions a TournamentPayment PENDING -> SUCCEEDED, even
   * if the webhook and the checkout-return verification race each other
   * for the same session.
   */
  private async claimRegistrationPaymentSuccess(
    paymentId: string,
    session: Stripe.Checkout.Session,
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      const claim = await tx.tournamentPayment.updateMany({
        where: {
          id: paymentId,
          status: { not: 'SUCCEEDED' },
        },
        data: {
          status: 'SUCCEEDED',
          stripePaymentIntentId:
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : (session.payment_intent?.id ?? null),
        },
      });

      const payment = await tx.tournamentPayment.findUniqueOrThrow({
        where: { id: paymentId },
        include: {
          registration: true,
          tournament: { select: { name: true } },
        },
      });

      return {
        claimed: claim.count > 0,
        registration: payment.registration,
        tournamentName: payment.tournament.name,
      };
    });

    if (result.claimed) {
      this.sendRegistrationPaymentConfirmedEmail({
        tournamentName: result.tournamentName,
        registration: result.registration,
      }).catch((err) => {
        console.warn('Registration payment confirmation email failed', err);
      });
    }

    return result;
  }

  async handleTournamentCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const payment = await this.prisma.tournamentPayment.findUnique({
      where: { stripeCheckoutSessionId: session.id },
    });

    if (!payment || payment.status === 'SUCCEEDED') {
      return;
    }

    if (session.payment_status !== 'paid') {
      return;
    }

    await this.claimRegistrationPaymentSuccess(payment.id, session);
  }

  async updateRegistration(
    userId: string,
    tournamentId: string,
    registrationId: string,
    dto: UpdateTournamentRegistrationDto,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const registration = await this.prisma.tournamentRegistration.findFirst({
      where: {
        id: registrationId,
        tournamentId,
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    return this.prisma.tournamentRegistration.update({
      where: {
        id: registrationId,
      },
      data: {
        status: dto.status,
      },
    });
  }

  async listRegistrations(userId: string, tournamentId: string) {
    await this.getOwnedTournament(userId, tournamentId);

    const registrations = await this.prisma.tournamentRegistration.findMany({
      where: {
        tournamentId,
      },
      include: {
        payments: {
          select: {
            status: true,
            amountCents: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return registrations.map(({ payments, ...registration }) => ({
      ...registration,
      paid: payments.some((payment) => payment.status === 'SUCCEEDED'),
    }));
  }

  async deleteRegistration(
    userId: string,
    tournamentId: string,
    registrationId: string,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const registration = await this.prisma.tournamentRegistration.findFirst({
      where: {
        id: registrationId,
        tournamentId,
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    await this.prisma.tournamentRegistration.delete({
      where: {
        id: registrationId,
      },
    });

    return {
      id: registration.id,
      deleted: true,
    };
  }

  async addSponsor(
    userId: string,
    tournamentId: string,
    dto: CreateTournamentSponsorDto,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    return this.prisma.tournamentSponsor.create({
      data: {
        tournamentId,
        name: dto.name.trim(),
        logoUrl: dto.logoUrl?.trim() || null,
        linkUrl: dto.linkUrl?.trim() || null,
      },
    });
  }

  async deleteSponsor(userId: string, tournamentId: string, sponsorId: string) {
    await this.getOwnedTournament(userId, tournamentId);

    const sponsor = await this.prisma.tournamentSponsor.findFirst({
      where: {
        id: sponsorId,
        tournamentId,
      },
    });

    if (!sponsor) {
      throw new NotFoundException('Sponsor not found');
    }

    await this.prisma.tournamentSponsor.delete({
      where: {
        id: sponsorId,
      },
    });

    return {
      id: sponsor.id,
      deleted: true,
    };
  }

  async addTeam(
    userId: string,
    tournamentId: string,
    dto: CreateTournamentTeamDto,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    if (dto.registrationId) {
      const registration = await this.prisma.tournamentRegistration.findFirst({
        where: { id: dto.registrationId, tournamentId },
        select: { id: true },
      });

      if (!registration) {
        throw new BadRequestException(
          'Registration does not belong to this tournament.',
        );
      }
    }

    return this.prisma.tournamentTeam.create({
      data: {
        tournamentId,
        name: dto.name.trim(),
        division: dto.division?.trim() || null,
        logoUrl: dto.logoUrl?.trim() || null,
        coachName: dto.coachName?.trim() || null,
        registrationId: dto.registrationId || null,
      },
      include: { players: true },
    });
  }

  /**
   * Convenience action for the common case: an organizer confirms a
   * registration and wants it to become a schedulable team without
   * retyping the team name and division.
   */
  async createTeamFromRegistration(
    userId: string,
    tournamentId: string,
    registrationId: string,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const registration = await this.prisma.tournamentRegistration.findFirst({
      where: { id: registrationId, tournamentId },
      include: { team: true },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (registration.team) {
      return this.prisma.tournamentTeam.findUniqueOrThrow({
        where: { id: registration.team.id },
        include: { players: true },
      });
    }

    return this.prisma.tournamentTeam.create({
      data: {
        tournamentId,
        name: registration.teamName,
        division: registration.division,
        registrationId: registration.id,
      },
      include: { players: true },
    });
  }

  async updateTeam(
    userId: string,
    tournamentId: string,
    teamId: string,
    dto: UpdateTournamentTeamDto,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const team = await this.prisma.tournamentTeam.findFirst({
      where: { id: teamId, tournamentId },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const updated = await this.prisma.tournamentTeam.update({
      where: { id: teamId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.division !== undefined
          ? { division: dto.division.trim() || null }
          : {}),
        ...(dto.logoUrl !== undefined
          ? { logoUrl: dto.logoUrl.trim() || null }
          : {}),
        ...(dto.coachName !== undefined
          ? { coachName: dto.coachName.trim() || null }
          : {}),
      },
      include: { players: true },
    });

    // Keep any scheduled games' display name in sync with a rename.
    if (dto.name !== undefined) {
      await this.prisma.tournamentGame.updateMany({
        where: { tournamentId, homeTeamId: teamId },
        data: { homeTeamName: updated.name },
      });

      await this.prisma.tournamentGame.updateMany({
        where: { tournamentId, awayTeamId: teamId },
        data: { awayTeamName: updated.name },
      });
    }

    return updated;
  }

  async deleteTeam(userId: string, tournamentId: string, teamId: string) {
    await this.getOwnedTournament(userId, tournamentId);

    const team = await this.prisma.tournamentTeam.findFirst({
      where: { id: teamId, tournamentId },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    await this.prisma.tournamentTeam.delete({ where: { id: teamId } });

    return { id: team.id, deleted: true };
  }

  async addTeamPlayer(
    userId: string,
    tournamentId: string,
    teamId: string,
    dto: CreateTournamentTeamPlayerDto,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const team = await this.prisma.tournamentTeam.findFirst({
      where: { id: teamId, tournamentId },
      select: { id: true },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return this.prisma.tournamentTeamPlayer.create({
      data: {
        teamId,
        displayName: dto.displayName.trim(),
        position: dto.position ?? null,
        jerseyNumber: dto.jerseyNumber ?? null,
      },
    });
  }

  async removeTeamPlayer(
    userId: string,
    tournamentId: string,
    teamId: string,
    playerId: string,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const player = await this.prisma.tournamentTeamPlayer.findFirst({
      where: { id: playerId, teamId, team: { tournamentId } },
    });

    if (!player) {
      throw new NotFoundException('Player not found');
    }

    await this.prisma.tournamentTeamPlayer.delete({
      where: { id: playerId },
    });

    return { id: player.id, deleted: true };
  }

  async upsertGamePlayerStat(
    userId: string,
    tournamentId: string,
    gameId: string,
    dto: UpsertTournamentGamePlayerStatDto,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const game = await this.prisma.tournamentGame.findFirst({
      where: { id: gameId, tournamentId },
      select: { id: true, homeTeamId: true, awayTeamId: true },
    });

    if (!game) {
      throw new NotFoundException('Tournament game not found');
    }

    const player = await this.prisma.tournamentTeamPlayer.findFirst({
      where: { id: dto.teamPlayerId, team: { tournamentId } },
      select: { id: true, teamId: true },
    });

    if (!player) {
      throw new BadRequestException(
        'Selected player does not belong to this tournament.',
      );
    }

    if (
      player.teamId !== game.homeTeamId &&
      player.teamId !== game.awayTeamId
    ) {
      throw new BadRequestException(
        "Selected player's team is not playing in this game.",
      );
    }

    return this.prisma.tournamentGamePlayerStat.upsert({
      where: {
        gameId_teamPlayerId: {
          gameId,
          teamPlayerId: dto.teamPlayerId,
        },
      },
      update: {
        goals: dto.goals ?? 0,
        assists: dto.assists ?? 0,
        penaltyMins: dto.penaltyMins ?? 0,
        plusMinus: dto.plusMinus ?? 0,
      },
      create: {
        gameId,
        teamPlayerId: dto.teamPlayerId,
        goals: dto.goals ?? 0,
        assists: dto.assists ?? 0,
        penaltyMins: dto.penaltyMins ?? 0,
        plusMinus: dto.plusMinus ?? 0,
      },
      include: { teamPlayer: true },
    });
  }

  async deleteGamePlayerStat(
    userId: string,
    tournamentId: string,
    gameId: string,
    statId: string,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const stat = await this.prisma.tournamentGamePlayerStat.findFirst({
      where: { id: statId, gameId, game: { tournamentId } },
    });

    if (!stat) {
      throw new NotFoundException('Stat line not found');
    }

    await this.prisma.tournamentGamePlayerStat.delete({
      where: { id: statId },
    });

    return { id: stat.id, deleted: true };
  }

  // Public - same visibility as the schedule.
  async getPlayerLeaders(tournamentId: string) {
    const stats = await this.prisma.tournamentGamePlayerStat.findMany({
      where: { game: { tournamentId } },
      include: {
        teamPlayer: {
          include: { team: { select: { id: true, name: true } } },
        },
      },
    });

    type LeaderRow = {
      teamPlayerId: string;
      displayName: string;
      teamName: string;
      gamesPlayed: number;
      goals: number;
      assists: number;
      points: number;
      penaltyMins: number;
    };

    const byPlayer = new Map<string, LeaderRow>();

    for (const stat of stats) {
      const existing = byPlayer.get(stat.teamPlayerId);

      const row: LeaderRow = existing ?? {
        teamPlayerId: stat.teamPlayerId,
        displayName: stat.teamPlayer.displayName,
        teamName: stat.teamPlayer.team.name,
        gamesPlayed: 0,
        goals: 0,
        assists: 0,
        points: 0,
        penaltyMins: 0,
      };

      row.gamesPlayed += 1;
      row.goals += stat.goals;
      row.assists += stat.assists;
      row.points += stat.goals + stat.assists;
      row.penaltyMins += stat.penaltyMins;

      byPlayer.set(stat.teamPlayerId, row);
    }

    return Array.from(byPlayer.values())
      .sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points;
        }

        if (b.goals !== a.goals) {
          return b.goals - a.goals;
        }

        return a.displayName.localeCompare(b.displayName);
      })
      .slice(0, 50);
  }

  // Public - standings are computed from final scores, same visibility as
  // the schedule. Tournament games store opponents as plain team-name
  // strings rather than real Team records, so teams are grouped by name.
  async getStandings(tournamentId: string, division?: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: {
        id: tournamentId,
      },
      select: {
        id: true,
      },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    let divisionTeamIds: Set<string> | null = null;

    if (division) {
      const divisionTeams = await this.prisma.tournamentTeam.findMany({
        where: { tournamentId, division },
        select: { id: true },
      });

      divisionTeamIds = new Set(divisionTeams.map((team) => team.id));
    }

    const games = await this.prisma.tournamentGame.findMany({
      where: {
        tournamentId,
        status: 'FINAL',
        homeScore: { not: null },
        awayScore: { not: null },
        ...(divisionTeamIds
          ? {
              homeTeamId: { in: Array.from(divisionTeamIds) },
              awayTeamId: { in: Array.from(divisionTeamIds) },
            }
          : {}),
      },
      select: {
        homeTeamName: true,
        awayTeamName: true,
        homeScore: true,
        awayScore: true,
      },
    });

    type StandingRow = {
      teamName: string;
      gamesPlayed: number;
      wins: number;
      losses: number;
      ties: number;
      goalsFor: number;
      goalsAgainst: number;
      goalDifferential: number;
      points: number;
    };

    const standingsByTeamName = new Map<string, StandingRow>();

    const rowFor = (teamName: string): StandingRow => {
      const existing = standingsByTeamName.get(teamName);

      if (existing) {
        return existing;
      }

      const created: StandingRow = {
        teamName,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifferential: 0,
        points: 0,
      };

      standingsByTeamName.set(teamName, created);

      return created;
    };

    const creditResult = (
      teamName: string,
      goalsFor: number,
      goalsAgainst: number,
    ) => {
      const row = rowFor(teamName);

      row.gamesPlayed += 1;
      row.goalsFor += goalsFor;
      row.goalsAgainst += goalsAgainst;
      row.goalDifferential = row.goalsFor - row.goalsAgainst;

      if (goalsFor > goalsAgainst) {
        row.wins += 1;
        row.points += 2;
      } else if (goalsFor < goalsAgainst) {
        row.losses += 1;
      } else {
        row.ties += 1;
        row.points += 1;
      }
    };

    for (const game of games) {
      creditResult(game.homeTeamName, game.homeScore!, game.awayScore!);
      creditResult(game.awayTeamName, game.awayScore!, game.homeScore!);
    }

    return Array.from(standingsByTeamName.values()).sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }

      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }

      if (b.goalDifferential !== a.goalDifferential) {
        return b.goalDifferential - a.goalDifferential;
      }

      return a.teamName.localeCompare(b.teamName);
    });
  }

  private appUrl(): string {
    return (process.env.APP_URL ?? 'http://localhost:4200').replace(/\/$/, '');
  }

  private async sendRegistrationReceivedEmail(args: {
    tournamentName: string;
    registration: {
      teamName: string;
      contactName: string;
      contactEmail: string;
    };
    waitlisted: boolean;
    feeCents: number | null;
  }): Promise<void> {
    const { tournamentName, registration, waitlisted, feeCents } = args;

    const statusLine = waitlisted
      ? "You're currently on the waitlist — we'll email you if a spot opens up."
      : 'Your spot is confirmed.';

    const feeLine =
      feeCents && feeCents > 0
        ? `A $${(feeCents / 100).toFixed(2)} registration fee applies. If you didn't finish payment, you can complete it from the tournament's Register tab.`
        : null;

    await this.emailService.sendMail({
      to: registration.contactEmail,
      subject: `Registration received: ${tournamentName}`,
      text: [
        `Hi ${registration.contactName},`,
        '',
        `We received ${registration.teamName}'s registration for ${tournamentName}.`,
        statusLine,
        feeLine,
        '',
        'Thanks,',
        'HockeySpare',
      ]
        .filter((line): line is string => line !== null)
        .join('\n'),
      html: `
        <p>Hi ${registration.contactName},</p>
        <p>We received <strong>${registration.teamName}</strong>'s registration for <strong>${tournamentName}</strong>.</p>
        <p>${statusLine}</p>
        ${feeLine ? `<p>${feeLine}</p>` : ''}
        <p>Thanks,<br />HockeySpare</p>
      `,
    });
  }

  private async sendRegistrationPaymentConfirmedEmail(args: {
    tournamentName: string;
    registration: {
      teamName: string;
      contactName: string;
      contactEmail: string;
    };
  }): Promise<void> {
    const { tournamentName, registration } = args;

    await this.emailService.sendMail({
      to: registration.contactEmail,
      subject: `Payment received: ${tournamentName}`,
      text: [
        `Hi ${registration.contactName},`,
        '',
        `We've received payment for ${registration.teamName}'s registration for ${tournamentName}. You're all set.`,
        '',
        'Thanks,',
        'HockeySpare',
      ].join('\n'),
      html: `
        <p>Hi ${registration.contactName},</p>
        <p>We've received payment for <strong>${registration.teamName}</strong>'s registration for <strong>${tournamentName}</strong>. You're all set.</p>
        <p>Thanks,<br />HockeySpare</p>
      `,
    });
  }

  async getPaymentsStatus(userId: string, tournamentId: string) {
    const tournament = await this.getOwnedTournament(userId, tournamentId);

    return {
      tournamentId: tournament.id,
      connected: !!tournament.stripeAccountId,
      payoutsEnabled: tournament.stripePayoutsEnabled,
      stripeConfigured: this.stripeService.isConfigured(),
      registrationFeeCents: tournament.registrationFeeCents,
    };
  }

  async connectStripeAccount(userId: string, tournamentId: string) {
    const tournament = await this.getOwnedTournament(userId, tournamentId);
    const client = this.stripeService.getClient();

    let accountId = tournament.stripeAccountId;

    if (!accountId) {
      const account = await client.accounts.create({
        type: 'express',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      accountId = account.id;

      await this.prisma.tournament.update({
        where: { id: tournament.id },
        data: { stripeAccountId: accountId },
      });
    }

    const returnUrl = `${this.appUrl()}/tournaments/${tournament.id}/manage?stripeReturn=1`;

    const accountLink = await client.accountLinks.create({
      account: accountId,
      refresh_url: returnUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return { url: accountLink.url };
  }

  async refreshStripeAccountStatus(userId: string, tournamentId: string) {
    const tournament = await this.getOwnedTournament(userId, tournamentId);

    if (!tournament.stripeAccountId) {
      return {
        tournamentId: tournament.id,
        connected: false,
        payoutsEnabled: false,
      };
    }

    const client = this.stripeService.getClient();
    const account = await client.accounts.retrieve(tournament.stripeAccountId);
    const payoutsEnabled = !!account.payouts_enabled;

    await this.prisma.tournament.update({
      where: { id: tournament.id },
      data: { stripePayoutsEnabled: payoutsEnabled },
    });

    return {
      tournamentId: tournament.id,
      connected: true,
      payoutsEnabled,
    };
  }

  /**
   * Standard single-elimination seeding order, e.g. seedOrder(8) returns
   * [1,8,4,5,2,7,3,6] so the top seeds are placed to meet as late as
   * possible in the bracket.
   */
  private seedOrder(size: number): number[] {
    if (size === 1) {
      return [1];
    }

    const prev = this.seedOrder(size / 2);
    const result: number[] = [];

    for (const seed of prev) {
      result.push(seed, size + 1 - seed);
    }

    return result;
  }

  private nextPowerOfTwo(count: number): number {
    let size = 1;

    while (size < count) {
      size *= 2;
    }

    return size;
  }

  async createBracket(
    userId: string,
    tournamentId: string,
    dto: CreateTournamentBracketDto,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const teamIds = Array.from(new Set(dto.teamIds));

    if (teamIds.length < 2) {
      throw new BadRequestException(
        'A bracket needs at least 2 distinct teams.',
      );
    }

    const teams = await this.prisma.tournamentTeam.findMany({
      where: { id: { in: teamIds }, tournamentId },
      select: { id: true },
    });

    if (teams.length !== teamIds.length) {
      throw new BadRequestException(
        'One or more selected teams do not belong to this tournament.',
      );
    }

    const bracketSize = this.nextPowerOfTwo(teamIds.length);
    const seedOrder = this.seedOrder(bracketSize);
    const totalRounds = Math.log2(bracketSize);
    const teamBySeed = (seed: number): string | null =>
      seed <= teamIds.length ? teamIds[seed - 1] : null;

    const bracketId = await this.prisma.$transaction(async (tx) => {
      const bracket = await tx.tournamentBracket.create({
        data: {
          tournamentId,
          name: dto.name.trim(),
          division: dto.division?.trim() || null,
        },
      });

      const matchIdsByRound: string[][] = [];

      for (let round = 1; round <= totalRounds; round++) {
        const matchesInRound = bracketSize / 2 ** round;
        const roundMatchIds: string[] = [];

        for (let position = 0; position < matchesInRound; position++) {
          const match = await tx.tournamentBracketMatch.create({
            data: {
              bracketId: bracket.id,
              round,
              position,
              team1Id:
                round === 1 ? teamBySeed(seedOrder[position * 2]) : null,
              team2Id:
                round === 1 ? teamBySeed(seedOrder[position * 2 + 1]) : null,
            },
          });

          roundMatchIds.push(match.id);
        }

        matchIdsByRound.push(roundMatchIds);
      }

      for (let round = 1; round < totalRounds; round++) {
        const currentRoundIds = matchIdsByRound[round - 1];
        const nextRoundIds = matchIdsByRound[round];

        for (let i = 0; i < currentRoundIds.length; i++) {
          await tx.tournamentBracketMatch.update({
            where: { id: currentRoundIds[i] },
            data: {
              nextMatchId: nextRoundIds[Math.floor(i / 2)],
              nextMatchSlot: (i % 2) + 1,
            },
          });
        }
      }

      // Round-1 byes (one team present, one absent) auto-advance immediately.
      const round1Matches = await tx.tournamentBracketMatch.findMany({
        where: { id: { in: matchIdsByRound[0] } },
      });

      for (const match of round1Matches) {
        const hasTeam1 = !!match.team1Id;
        const hasTeam2 = !!match.team2Id;

        if (hasTeam1 === hasTeam2) {
          continue;
        }

        const winnerTeamId = (hasTeam1 ? match.team1Id : match.team2Id)!;

        await tx.tournamentBracketMatch.update({
          where: { id: match.id },
          data: { isBye: true, winnerTeamId },
        });

        if (match.nextMatchId && match.nextMatchSlot) {
          await tx.tournamentBracketMatch.update({
            where: { id: match.nextMatchId },
            data:
              match.nextMatchSlot === 1
                ? { team1Id: winnerTeamId }
                : { team2Id: winnerTeamId },
          });
        }
      }

      return bracket.id;
    });

    return this.prisma.tournamentBracket.findUniqueOrThrow({
      where: { id: bracketId },
      include: this.tournamentInclude.brackets.include,
    });
  }

  async deleteBracket(userId: string, tournamentId: string, bracketId: string) {
    await this.getOwnedTournament(userId, tournamentId);

    const bracket = await this.prisma.tournamentBracket.findFirst({
      where: { id: bracketId, tournamentId },
    });

    if (!bracket) {
      throw new NotFoundException('Bracket not found');
    }

    await this.prisma.tournamentBracket.delete({ where: { id: bracket.id } });

    return { id: bracket.id, deleted: true };
  }

  async scheduleMatchGame(
    userId: string,
    tournamentId: string,
    bracketId: string,
    matchId: string,
    dto: ScheduleBracketMatchGameDto,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const match = await this.prisma.tournamentBracketMatch.findFirst({
      where: { id: matchId, bracketId, bracket: { tournamentId } },
    });

    if (!match) {
      throw new NotFoundException('Bracket match not found');
    }

    if (!match.team1Id || !match.team2Id) {
      throw new BadRequestException(
        'Both teams for this match must be determined before scheduling it.',
      );
    }

    if (match.gameId) {
      throw new BadRequestException(
        'This match already has a game scheduled.',
      );
    }

    const homeTeamName = await this.resolveTeamName(
      tournamentId,
      match.team1Id,
    );
    const awayTeamName = await this.resolveTeamName(
      tournamentId,
      match.team2Id,
    );

    const game = await this.prisma.tournamentGame.create({
      data: {
        tournamentId,
        homeTeamName,
        awayTeamName,
        homeTeamId: match.team1Id,
        awayTeamId: match.team2Id,
        startsAt: new Date(dto.startsAt),
        arenaName: dto.arenaName?.trim() || null,
        notes: dto.notes?.trim() || null,
      },
    });

    await this.prisma.tournamentBracketMatch.update({
      where: { id: match.id },
      data: { gameId: game.id },
    });

    return game;
  }
}
