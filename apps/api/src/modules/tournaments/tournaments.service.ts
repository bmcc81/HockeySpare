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
import { generateApiKey } from './api-key.util';
import { StripeService } from '../stripe/stripe.service';
import { EmailService } from '../email/email.service';
import { FileStorageService } from '../file-storage/file-storage.service';
import { AiService } from '../../ai/ai.service';
import { createHmac, randomBytes } from 'crypto';
import type Stripe from 'stripe';

@Injectable()
export class TournamentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly emailService: EmailService,
    private readonly fileStorageService: FileStorageService,
    private readonly aiService: AiService,
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
        refereeAssignments: {
          include: {
            referee: { select: { id: true, name: true } },
          },
        },
      },
    },
    sponsors: {
      orderBy: {
        createdAt: 'asc' as const,
      },
    },
    announcements: {
      orderBy: {
        createdAt: 'desc' as const,
      },
    },
    venues: {
      orderBy: {
        createdAt: 'asc' as const,
      },
    },
    mediaAssets: {
      orderBy: {
        createdAt: 'desc' as const,
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
    volunteerShifts: {
      orderBy: {
        startsAt: 'asc' as const,
      },
      include: {
        _count: {
          select: { signups: true },
        },
      },
    },
    infoListings: {
      orderBy: {
        createdAt: 'asc' as const,
      },
    },
    lostFoundItems: {
      orderBy: {
        createdAt: 'desc' as const,
      },
    },
  };

  /**
   * Owner OR an active co-organizer can manage the tournament day-to-day.
   * Actions that affect who can manage it (adding/removing co-organizers)
   * go through getOwnerOnlyTournament instead.
   */
  private async getOwnedTournament(userId: string, tournamentId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: {
        id: tournamentId,
      },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    if (tournament.createdById === userId) {
      return tournament;
    }

    const coOrganizer = await this.prisma.tournamentCoOrganizer.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId,
          userId,
        },
      },
    });

    if (!coOrganizer) {
      throw new ForbiddenException(
        'Only the tournament creator or a co-organizer can manage this tournament.',
      );
    }

    return tournament;
  }

  private async getOwnerOnlyTournament(userId: string, tournamentId: string) {
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
        'Only the tournament creator can manage co-organizers.',
      );
    }

    return tournament;
  }

  private async logAudit(
    tournamentId: string,
    userId: string,
    action: string,
    detail?: string | null,
  ): Promise<void> {
    await this.prisma.tournamentAuditLogEntry.create({
      data: {
        tournamentId,
        userId,
        action,
        detail: detail ?? null,
      },
    });
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
        contactName: dto.contactName?.trim() || null,
        contactEmail: dto.contactEmail?.trim() || null,
        contactPhone: dto.contactPhone?.trim() || null,
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

    const updated = await this.prisma.tournament.update({
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
        ...(dto.contactName !== undefined
          ? { contactName: dto.contactName.trim() || null }
          : {}),
        ...(dto.contactEmail !== undefined
          ? { contactEmail: dto.contactEmail.trim() || null }
          : {}),
        ...(dto.contactPhone !== undefined
          ? { contactPhone: dto.contactPhone.trim() || null }
          : {}),
      },
      include: this.tournamentInclude,
    });

    await this.logAudit(tournamentId, userId, 'TOURNAMENT_UPDATED');

    return updated;
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

    const game = await this.prisma.tournamentGame.create({
      data: {
        tournamentId,
        homeTeamName,
        awayTeamName,
        homeTeamId: dto.homeTeamId || null,
        awayTeamId: dto.awayTeamId || null,
        startsAt: new Date(dto.startsAt),
        arenaName: dto.arenaName?.trim() || null,
        notes: dto.notes?.trim() || null,
        livestreamUrl: dto.livestreamUrl?.trim() || null,
      },
    });

    await this.logAudit(
      tournamentId,
      userId,
      'GAME_ADDED',
      `${homeTeamName} vs ${awayTeamName}`,
    );

    return game;
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
        ...(dto.livestreamUrl !== undefined
          ? { livestreamUrl: dto.livestreamUrl.trim() || null }
          : {}),
      },
    });

    if (updatedGame.status === 'FINAL') {
      await this.advanceBracketIfNeeded(updatedGame.id);
    }

    if (
      (dto.status !== undefined ||
        dto.homeScore !== undefined ||
        dto.awayScore !== undefined) &&
      (updatedGame.status === 'LIVE' || updatedGame.status === 'FINAL')
    ) {
      this.fireGameWebhooks(tournamentId, updatedGame).catch((err) => {
        console.warn('Webhook dispatch failed', err);
      });
    }

    return updatedGame;
  }

  /**
   * Fire-and-forget delivery to any active webhooks for this tournament -
   * third-party/AI integrations (F017) shouldn't be able to slow down or
   * fail an organizer's score update.
   */
  private async fireGameWebhooks(
    tournamentId: string,
    game: {
      id: string;
      homeTeamName: string;
      awayTeamName: string;
      homeScore: number | null;
      awayScore: number | null;
      status: string;
      startsAt: Date;
    },
  ): Promise<void> {
    const webhooks = await this.prisma.tournamentWebhook.findMany({
      where: { tournamentId, active: true },
    });

    if (webhooks.length === 0) {
      return;
    }

    const payload = {
      event: game.status === 'FINAL' ? 'game.final' : 'game.updated',
      tournamentId,
      game: {
        id: game.id,
        homeTeamName: game.homeTeamName,
        awayTeamName: game.awayTeamName,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        status: game.status,
        startsAt: game.startsAt,
      },
      sentAt: new Date().toISOString(),
    };

    const body = JSON.stringify(payload);

    for (const webhook of webhooks) {
      const signature = createHmac('sha256', webhook.secret)
        .update(body)
        .digest('hex');

      fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-HockeySpare-Signature': `sha256=${signature}`,
        },
        body,
      }).catch((err) => {
        console.warn(
          `Webhook delivery failed for tournament ${tournamentId} -> ${webhook.url}`,
          err,
        );
      });
    }
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

    await this.logAudit(
      tournamentId,
      userId,
      'GAME_DELETED',
      `${game.homeTeamName} vs ${game.awayTeamName}`,
    );

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

    const updated = await this.prisma.tournamentRegistration.update({
      where: {
        id: registrationId,
      },
      data: {
        status: dto.status,
      },
    });

    await this.logAudit(
      tournamentId,
      userId,
      'REGISTRATION_STATUS_CHANGED',
      `${registration.teamName} -> ${dto.status}`,
    );

    return updated;
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

    await this.logAudit(
      tournamentId,
      userId,
      'REGISTRATION_DELETED',
      registration.teamName,
    );

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

    const sponsor = await this.prisma.tournamentSponsor.create({
      data: {
        tournamentId,
        name: dto.name.trim(),
        logoUrl: dto.logoUrl?.trim() || null,
        linkUrl: dto.linkUrl?.trim() || null,
        tier: dto.tier ?? null,
      },
    });

    await this.logAudit(tournamentId, userId, 'SPONSOR_ADDED', sponsor.name);

    return sponsor;
  }

  async updateSponsor(
    userId: string,
    tournamentId: string,
    sponsorId: string,
    dto: UpdateTournamentSponsorDto,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const sponsor = await this.prisma.tournamentSponsor.findFirst({
      where: { id: sponsorId, tournamentId },
    });

    if (!sponsor) {
      throw new NotFoundException('Sponsor not found');
    }

    const updated = await this.prisma.tournamentSponsor.update({
      where: { id: sponsorId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.logoUrl !== undefined
          ? { logoUrl: dto.logoUrl.trim() || null }
          : {}),
        ...(dto.linkUrl !== undefined
          ? { linkUrl: dto.linkUrl.trim() || null }
          : {}),
        ...(dto.tier !== undefined ? { tier: dto.tier ?? null } : {}),
      },
    });

    await this.logAudit(tournamentId, userId, 'SPONSOR_UPDATED', updated.name);

    return updated;
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

    await this.logAudit(tournamentId, userId, 'SPONSOR_DELETED', sponsor.name);

    return {
      id: sponsor.id,
      deleted: true,
    };
  }

  async addAnnouncement(
    userId: string,
    tournamentId: string,
    dto: CreateTournamentAnnouncementDto,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const announcement = await this.prisma.tournamentAnnouncement.create({
      data: {
        tournamentId,
        body: dto.body.trim(),
        type: dto.type ?? 'GENERAL',
      },
    });

    await this.logAudit(
      tournamentId,
      userId,
      dto.type === 'WEATHER' ? 'WEATHER_ALERT_POSTED' : 'ANNOUNCEMENT_POSTED',
    );

    return announcement;
  }

  async deleteAnnouncement(
    userId: string,
    tournamentId: string,
    announcementId: string,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const announcement = await this.prisma.tournamentAnnouncement.findFirst({
      where: { id: announcementId, tournamentId },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    await this.prisma.tournamentAnnouncement.delete({
      where: { id: announcementId },
    });

    await this.logAudit(tournamentId, userId, 'ANNOUNCEMENT_DELETED');

    return { id: announcement.id, deleted: true };
  }

  async addVenue(
    userId: string,
    tournamentId: string,
    dto: CreateTournamentVenueDto,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const venue = await this.prisma.tournamentVenue.create({
      data: {
        tournamentId,
        name: dto.name.trim(),
        address: dto.address?.trim() || null,
        parkingInfo: dto.parkingInfo?.trim() || null,
        dressingRoomInfo: dto.dressingRoomInfo?.trim() || null,
        concessionsInfo: dto.concessionsInfo?.trim() || null,
      },
    });

    await this.logAudit(tournamentId, userId, 'VENUE_ADDED', venue.name);

    return venue;
  }

  async updateVenue(
    userId: string,
    tournamentId: string,
    venueId: string,
    dto: UpdateTournamentVenueDto,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const venue = await this.prisma.tournamentVenue.findFirst({
      where: { id: venueId, tournamentId },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    const updated = await this.prisma.tournamentVenue.update({
      where: { id: venueId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.address !== undefined
          ? { address: dto.address.trim() || null }
          : {}),
        ...(dto.parkingInfo !== undefined
          ? { parkingInfo: dto.parkingInfo.trim() || null }
          : {}),
        ...(dto.dressingRoomInfo !== undefined
          ? { dressingRoomInfo: dto.dressingRoomInfo.trim() || null }
          : {}),
        ...(dto.concessionsInfo !== undefined
          ? { concessionsInfo: dto.concessionsInfo.trim() || null }
          : {}),
      },
    });

    await this.logAudit(tournamentId, userId, 'VENUE_UPDATED', updated.name);

    return updated;
  }

  async deleteVenue(userId: string, tournamentId: string, venueId: string) {
    await this.getOwnedTournament(userId, tournamentId);

    const venue = await this.prisma.tournamentVenue.findFirst({
      where: { id: venueId, tournamentId },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    await this.prisma.tournamentVenue.delete({ where: { id: venueId } });

    await this.logAudit(tournamentId, userId, 'VENUE_DELETED', venue.name);

    return { id: venue.id, deleted: true };
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

    const team = await this.prisma.tournamentTeam.create({
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

    await this.logAudit(tournamentId, userId, 'TEAM_ADDED', team.name);

    return team;
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

    await this.logAudit(tournamentId, userId, 'TEAM_UPDATED', updated.name);

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

    await this.logAudit(tournamentId, userId, 'TEAM_DELETED', team.name);

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

    const created = await this.prisma.tournamentBracket.findUniqueOrThrow({
      where: { id: bracketId },
      include: this.tournamentInclude.brackets.include,
    });

    await this.logAudit(tournamentId, userId, 'BRACKET_CREATED', created.name);

    return created;
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

    await this.logAudit(tournamentId, userId, 'BRACKET_DELETED', bracket.name);

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

  async listCoOrganizers(userId: string, tournamentId: string) {
    await this.getOwnedTournament(userId, tournamentId);

    return this.prisma.tournamentCoOrganizer.findMany({
      where: { tournamentId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addCoOrganizer(
    userId: string,
    tournamentId: string,
    dto: AddTournamentCoOrganizerDto,
  ) {
    const tournament = await this.getOwnerOnlyTournament(userId, tournamentId);

    const email = dto.email.trim().toLowerCase();
    const targetUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!targetUser) {
      throw new NotFoundException(
        'No HockeySpare account found with that email. Ask them to sign up first.',
      );
    }

    if (targetUser.id === tournament.createdById) {
      throw new BadRequestException(
        'This user already owns the tournament.',
      );
    }

    const existing = await this.prisma.tournamentCoOrganizer.findUnique({
      where: {
        tournamentId_userId: { tournamentId, userId: targetUser.id },
      },
    });

    if (existing) {
      throw new BadRequestException(
        'This user is already a co-organizer of this tournament.',
      );
    }

    const coOrganizer = await this.prisma.tournamentCoOrganizer.create({
      data: { tournamentId, userId: targetUser.id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    await this.logAudit(
      tournamentId,
      userId,
      'CO_ORGANIZER_ADDED',
      `Added ${targetUser.email} as a co-organizer`,
    );

    return coOrganizer;
  }

  async removeCoOrganizer(
    userId: string,
    tournamentId: string,
    coOrganizerId: string,
  ) {
    await this.getOwnerOnlyTournament(userId, tournamentId);

    const coOrganizer = await this.prisma.tournamentCoOrganizer.findFirst({
      where: { id: coOrganizerId, tournamentId },
      include: { user: { select: { email: true } } },
    });

    if (!coOrganizer) {
      throw new NotFoundException('Co-organizer not found');
    }

    await this.prisma.tournamentCoOrganizer.delete({
      where: { id: coOrganizer.id },
    });

    await this.logAudit(
      tournamentId,
      userId,
      'CO_ORGANIZER_REMOVED',
      `Removed ${coOrganizer.user.email} as a co-organizer`,
    );

    return { id: coOrganizer.id, deleted: true };
  }

  async listAuditLog(userId: string, tournamentId: string) {
    await this.getOwnedTournament(userId, tournamentId);

    return this.prisma.tournamentAuditLogEntry.findMany({
      where: { tournamentId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async listPayments(userId: string, tournamentId: string) {
    await this.getOwnedTournament(userId, tournamentId);

    return this.prisma.tournamentPayment.findMany({
      where: { tournamentId },
      include: {
        registration: {
          select: { teamName: true, contactName: true, contactEmail: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  getFileStorageStatus() {
    return { configured: this.fileStorageService.isConfigured() };
  }

  private readonly allowedImageMimeTypes = [
    'image/png',
    'image/jpeg',
    'image/webp',
  ];

  private assertImageFile(file: Express.Multer.File): void {
    if (!this.allowedImageMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only PNG, JPEG, or WEBP images are allowed.',
      );
    }
  }

  async uploadLogo(
    userId: string,
    tournamentId: string,
    file: Express.Multer.File,
  ) {
    const tournament = await this.getOwnedTournament(userId, tournamentId);
    this.assertImageFile(file);

    const url = await this.fileStorageService.uploadFile(
      `tournaments/${tournamentId}/logo`,
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    if (tournament.logoUrl) {
      await this.fileStorageService
        .deleteFileByUrl(tournament.logoUrl)
        .catch(() => {});
    }

    const updated = await this.prisma.tournament.update({
      where: { id: tournamentId },
      data: { logoUrl: url },
      include: this.tournamentInclude,
    });

    await this.logAudit(tournamentId, userId, 'LOGO_UPLOADED');

    return updated;
  }

  async uploadRulebook(
    userId: string,
    tournamentId: string,
    file: Express.Multer.File,
  ) {
    const tournament = await this.getOwnedTournament(userId, tournamentId);

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException(
        'Only PDF files are allowed for the rulebook.',
      );
    }

    const url = await this.fileStorageService.uploadFile(
      `tournaments/${tournamentId}/rulebook`,
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    if (tournament.rulebookUrl) {
      await this.fileStorageService
        .deleteFileByUrl(tournament.rulebookUrl)
        .catch(() => {});
    }

    const updated = await this.prisma.tournament.update({
      where: { id: tournamentId },
      data: { rulebookUrl: url },
      include: this.tournamentInclude,
    });

    await this.logAudit(tournamentId, userId, 'RULEBOOK_UPLOADED');

    return updated;
  }

  async addMediaAsset(
    userId: string,
    tournamentId: string,
    file: Express.Multer.File,
    caption?: string,
  ) {
    await this.getOwnedTournament(userId, tournamentId);
    this.assertImageFile(file);

    const url = await this.fileStorageService.uploadFile(
      `tournaments/${tournamentId}/media`,
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    const asset = await this.prisma.tournamentMediaAsset.create({
      data: {
        tournamentId,
        url,
        caption: caption?.trim() || null,
      },
    });

    await this.logAudit(tournamentId, userId, 'MEDIA_ADDED');

    return asset;
  }

  async deleteMediaAsset(
    userId: string,
    tournamentId: string,
    assetId: string,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const asset = await this.prisma.tournamentMediaAsset.findFirst({
      where: { id: assetId, tournamentId },
    });

    if (!asset) {
      throw new NotFoundException('Media asset not found');
    }

    await this.fileStorageService.deleteFileByUrl(asset.url).catch(() => {});

    await this.prisma.tournamentMediaAsset.delete({
      where: { id: assetId },
    });

    await this.logAudit(tournamentId, userId, 'MEDIA_DELETED');

    return { id: asset.id, deleted: true };
  }

  async listApiKeys(userId: string, tournamentId: string) {
    await this.getOwnedTournament(userId, tournamentId);

    return this.prisma.tournamentApiKey.findMany({
      where: { tournamentId },
      select: {
        id: true,
        tournamentId: true,
        label: true,
        keyPrefix: true,
        createdAt: true,
        lastUsedAt: true,
        revokedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createApiKey(
    userId: string,
    tournamentId: string,
    dto: CreateTournamentApiKeyDto,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const { plaintext, hash, prefix } = generateApiKey();

    const apiKey = await this.prisma.tournamentApiKey.create({
      data: {
        tournamentId,
        label: dto.label.trim(),
        keyHash: hash,
        keyPrefix: prefix,
      },
    });

    await this.logAudit(tournamentId, userId, 'API_KEY_CREATED', apiKey.label);

    // The plaintext key is only ever available in this response - only
    // keyPrefix is stored/returned from here on. keyHash is never sent to
    // the client, even here.
    const { keyHash: _keyHash, ...apiKeyWithoutHash } = apiKey;
    return { ...apiKeyWithoutHash, key: plaintext };
  }

  async revokeApiKey(userId: string, tournamentId: string, keyId: string) {
    await this.getOwnedTournament(userId, tournamentId);

    const apiKey = await this.prisma.tournamentApiKey.findFirst({
      where: { id: keyId, tournamentId },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    if (apiKey.revokedAt) {
      return { id: apiKey.id, deleted: true };
    }

    // Soft-revoke rather than delete, so the organizer can still see when
    // a given key was cut off instead of it just vanishing from the list.
    await this.prisma.tournamentApiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    });

    await this.logAudit(tournamentId, userId, 'API_KEY_REVOKED', apiKey.label);

    return { id: apiKey.id, deleted: true };
  }

  async listWebhooks(userId: string, tournamentId: string) {
    await this.getOwnedTournament(userId, tournamentId);

    return this.prisma.tournamentWebhook.findMany({
      where: { tournamentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createWebhook(
    userId: string,
    tournamentId: string,
    dto: CreateTournamentWebhookDto,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const webhook = await this.prisma.tournamentWebhook.create({
      data: {
        tournamentId,
        url: dto.url.trim(),
        secret: dto.secret?.trim() || randomBytes(24).toString('hex'),
      },
    });

    await this.logAudit(tournamentId, userId, 'WEBHOOK_ADDED', webhook.url);

    return webhook;
  }

  async deleteWebhook(userId: string, tournamentId: string, webhookId: string) {
    await this.getOwnedTournament(userId, tournamentId);

    const webhook = await this.prisma.tournamentWebhook.findFirst({
      where: { id: webhookId, tournamentId },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    await this.prisma.tournamentWebhook.delete({ where: { id: webhookId } });

    await this.logAudit(tournamentId, userId, 'WEBHOOK_REMOVED', webhook.url);

    return { id: webhook.id, deleted: true };
  }

  getScoresheetOcrStatus() {
    return { configured: this.aiService.isScoresheetOcrConfigured() };
  }

  /**
   * Photographs a paper scoresheet and returns an AI-extracted draft for
   * the organizer to review - this never writes the score or stats itself.
   * The photo is kept on the game as a reference regardless of whether the
   * organizer ends up using the extracted values.
   */
  async scanScoresheet(
    userId: string,
    tournamentId: string,
    gameId: string,
    file: Express.Multer.File,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const game = await this.prisma.tournamentGame.findFirst({
      where: { id: gameId, tournamentId },
    });

    if (!game) {
      throw new NotFoundException('Tournament game not found');
    }

    this.assertImageFile(file);

    const photoUrl = await this.fileStorageService.uploadFile(
      `tournaments/${tournamentId}/scoresheets`,
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    if (game.scoresheetPhotoUrl) {
      await this.fileStorageService
        .deleteFileByUrl(game.scoresheetPhotoUrl)
        .catch(() => {});
    }

    const updatedGame = await this.prisma.tournamentGame.update({
      where: { id: gameId },
      data: { scoresheetPhotoUrl: photoUrl },
    });

    const extraction = await this.aiService.extractScoresheetData(
      file.buffer,
      file.mimetype,
    );

    await this.logAudit(
      tournamentId,
      userId,
      'SCORESHEET_SCANNED',
      `${game.homeTeamName} vs ${game.awayTeamName}`,
    );

    return { game: updatedGame, extraction };
  }

  // --- Referees ---

  async listReferees(userId: string, tournamentId: string) {
    await this.getOwnedTournament(userId, tournamentId);

    return this.prisma.tournamentReferee.findMany({
      where: { tournamentId },
      orderBy: { name: 'asc' },
    });
  }

  async createReferee(
    userId: string,
    tournamentId: string,
    dto: CreateTournamentRefereeDto,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const referee = await this.prisma.tournamentReferee.create({
      data: {
        tournamentId,
        name: dto.name.trim(),
        email: dto.email?.trim() || null,
        phone: dto.phone?.trim() || null,
      },
    });

    await this.logAudit(tournamentId, userId, 'REFEREE_ADDED', referee.name);

    return referee;
  }

  async deleteReferee(userId: string, tournamentId: string, refereeId: string) {
    await this.getOwnedTournament(userId, tournamentId);

    const referee = await this.prisma.tournamentReferee.findFirst({
      where: { id: refereeId, tournamentId },
    });

    if (!referee) {
      throw new NotFoundException('Referee not found');
    }

    await this.prisma.tournamentReferee.delete({ where: { id: refereeId } });

    await this.logAudit(tournamentId, userId, 'REFEREE_REMOVED', referee.name);

    return { id: referee.id, deleted: true };
  }

  async assignRefereeToGame(
    userId: string,
    tournamentId: string,
    gameId: string,
    dto: AssignTournamentGameRefereeDto,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const game = await this.prisma.tournamentGame.findFirst({
      where: { id: gameId, tournamentId },
      select: { id: true },
    });

    if (!game) {
      throw new NotFoundException('Tournament game not found');
    }

    const referee = await this.prisma.tournamentReferee.findFirst({
      where: { id: dto.refereeId, tournamentId },
    });

    if (!referee) {
      throw new BadRequestException(
        'Selected referee does not belong to this tournament.',
      );
    }

    const existing = await this.prisma.tournamentGameReferee.findUnique({
      where: { gameId_refereeId: { gameId, refereeId: dto.refereeId } },
    });

    if (existing) {
      throw new BadRequestException(
        'This referee is already assigned to this game.',
      );
    }

    const assignment = await this.prisma.tournamentGameReferee.create({
      data: {
        gameId,
        refereeId: dto.refereeId,
        role: dto.role?.trim() || null,
      },
      include: {
        referee: { select: { id: true, name: true } },
      },
    });

    await this.logAudit(
      tournamentId,
      userId,
      'REFEREE_ASSIGNED',
      referee.name,
    );

    return assignment;
  }

  async unassignRefereeFromGame(
    userId: string,
    tournamentId: string,
    gameId: string,
    assignmentId: string,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const assignment = await this.prisma.tournamentGameReferee.findFirst({
      where: { id: assignmentId, gameId, game: { tournamentId } },
      include: { referee: { select: { name: true } } },
    });

    if (!assignment) {
      throw new NotFoundException('Referee assignment not found');
    }

    await this.prisma.tournamentGameReferee.delete({
      where: { id: assignmentId },
    });

    await this.logAudit(
      tournamentId,
      userId,
      'REFEREE_UNASSIGNED',
      assignment.referee.name,
    );

    return { id: assignment.id, deleted: true };
  }

  // --- Volunteer shifts ---

  async createVolunteerShift(
    userId: string,
    tournamentId: string,
    dto: CreateTournamentVolunteerShiftDto,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const shift = await this.prisma.tournamentVolunteerShift.create({
      data: {
        tournamentId,
        role: dto.role.trim(),
        description: dto.description?.trim() || null,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        location: dto.location?.trim() || null,
        capacity: dto.capacity ?? null,
      },
    });

    await this.logAudit(
      tournamentId,
      userId,
      'VOLUNTEER_SHIFT_ADDED',
      shift.role,
    );

    return shift;
  }

  async deleteVolunteerShift(
    userId: string,
    tournamentId: string,
    shiftId: string,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const shift = await this.prisma.tournamentVolunteerShift.findFirst({
      where: { id: shiftId, tournamentId },
    });

    if (!shift) {
      throw new NotFoundException('Volunteer shift not found');
    }

    await this.prisma.tournamentVolunteerShift.delete({
      where: { id: shiftId },
    });

    await this.logAudit(
      tournamentId,
      userId,
      'VOLUNTEER_SHIFT_REMOVED',
      shift.role,
    );

    return { id: shift.id, deleted: true };
  }

  // Public - anyone with the link can sign up for a volunteer shift, same
  // trust model as tournament registration.
  async signUpForVolunteerShift(
    tournamentId: string,
    shiftId: string,
    dto: CreateTournamentVolunteerSignupDto,
  ) {
    const shift = await this.prisma.tournamentVolunteerShift.findFirst({
      where: { id: shiftId, tournamentId },
      include: { _count: { select: { signups: true } } },
    });

    if (!shift) {
      throw new NotFoundException('Volunteer shift not found');
    }

    if (shift.capacity !== null && shift._count.signups >= shift.capacity) {
      throw new BadRequestException('This volunteer shift is already full.');
    }

    return this.prisma.tournamentVolunteerSignup.create({
      data: {
        shiftId,
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone?.trim() || null,
      },
    });
  }

  async listVolunteerSignups(
    userId: string,
    tournamentId: string,
    shiftId: string,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const shift = await this.prisma.tournamentVolunteerShift.findFirst({
      where: { id: shiftId, tournamentId },
    });

    if (!shift) {
      throw new NotFoundException('Volunteer shift not found');
    }

    return this.prisma.tournamentVolunteerSignup.findMany({
      where: { shiftId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // --- Info listings (hotel / merchandise / vendor) ---

  async createInfoListing(
    userId: string,
    tournamentId: string,
    dto: CreateTournamentInfoListingDto,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const listing = await this.prisma.tournamentInfoListing.create({
      data: {
        tournamentId,
        category: dto.category,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        url: dto.url?.trim() || null,
        imageUrl: dto.imageUrl?.trim() || null,
      },
    });

    await this.logAudit(
      tournamentId,
      userId,
      'INFO_LISTING_ADDED',
      `${listing.category}: ${listing.title}`,
    );

    return listing;
  }

  async updateInfoListing(
    userId: string,
    tournamentId: string,
    listingId: string,
    dto: UpdateTournamentInfoListingDto,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const listing = await this.prisma.tournamentInfoListing.findFirst({
      where: { id: listingId, tournamentId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const updated = await this.prisma.tournamentInfoListing.update({
      where: { id: listingId },
      data: {
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() || null }
          : {}),
        ...(dto.url !== undefined ? { url: dto.url.trim() || null } : {}),
        ...(dto.imageUrl !== undefined
          ? { imageUrl: dto.imageUrl.trim() || null }
          : {}),
      },
    });

    await this.logAudit(
      tournamentId,
      userId,
      'INFO_LISTING_UPDATED',
      updated.title,
    );

    return updated;
  }

  async deleteInfoListing(
    userId: string,
    tournamentId: string,
    listingId: string,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const listing = await this.prisma.tournamentInfoListing.findFirst({
      where: { id: listingId, tournamentId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    await this.prisma.tournamentInfoListing.delete({
      where: { id: listingId },
    });

    await this.logAudit(
      tournamentId,
      userId,
      'INFO_LISTING_REMOVED',
      listing.title,
    );

    return { id: listing.id, deleted: true };
  }

  // --- Lost & found ---

  async createLostFoundItem(
    userId: string,
    tournamentId: string,
    dto: CreateTournamentLostFoundItemDto,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const item = await this.prisma.tournamentLostFoundItem.create({
      data: {
        tournamentId,
        description: dto.description.trim(),
        imageUrl: dto.imageUrl?.trim() || null,
        contactInfo: dto.contactInfo?.trim() || null,
      },
    });

    await this.logAudit(tournamentId, userId, 'LOST_FOUND_ITEM_ADDED');

    return item;
  }

  async updateLostFoundItem(
    userId: string,
    tournamentId: string,
    itemId: string,
    dto: UpdateTournamentLostFoundItemDto,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const item = await this.prisma.tournamentLostFoundItem.findFirst({
      where: { id: itemId, tournamentId },
    });

    if (!item) {
      throw new NotFoundException('Lost & found item not found');
    }

    const updated = await this.prisma.tournamentLostFoundItem.update({
      where: { id: itemId },
      data: {
        ...(dto.description !== undefined
          ? { description: dto.description.trim() }
          : {}),
        ...(dto.imageUrl !== undefined
          ? { imageUrl: dto.imageUrl.trim() || null }
          : {}),
        ...(dto.contactInfo !== undefined
          ? { contactInfo: dto.contactInfo.trim() || null }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });

    await this.logAudit(tournamentId, userId, 'LOST_FOUND_ITEM_UPDATED');

    return updated;
  }

  async deleteLostFoundItem(
    userId: string,
    tournamentId: string,
    itemId: string,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const item = await this.prisma.tournamentLostFoundItem.findFirst({
      where: { id: itemId, tournamentId },
    });

    if (!item) {
      throw new NotFoundException('Lost & found item not found');
    }

    await this.prisma.tournamentLostFoundItem.delete({
      where: { id: itemId },
    });

    await this.logAudit(tournamentId, userId, 'LOST_FOUND_ITEM_REMOVED');

    return { id: item.id, deleted: true };
  }
}
