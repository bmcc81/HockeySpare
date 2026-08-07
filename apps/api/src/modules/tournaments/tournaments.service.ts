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
    },
    sponsors: {
      orderBy: {
        createdAt: 'asc' as const,
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

  async addGame(
    userId: string,
    tournamentId: string,
    dto: CreateTournamentGameDto,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    return this.prisma.tournamentGame.create({
      data: {
        tournamentId,
        homeTeamName: dto.homeTeamName.trim(),
        awayTeamName: dto.awayTeamName.trim(),
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

    return this.prisma.tournamentGame.update({
      where: {
        id: gameId,
      },
      data: {
        ...(dto.homeTeamName !== undefined
          ? { homeTeamName: dto.homeTeamName.trim() }
          : {}),
        ...(dto.awayTeamName !== undefined
          ? { awayTeamName: dto.awayTeamName.trim() }
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

  // Public - standings are computed from final scores, same visibility as
  // the schedule. Tournament games store opponents as plain team-name
  // strings rather than real Team records, so teams are grouped by name.
  async getStandings(tournamentId: string) {
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

    const games = await this.prisma.tournamentGame.findMany({
      where: {
        tournamentId,
        status: 'FINAL',
        homeScore: { not: null },
        awayScore: { not: null },
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
}
