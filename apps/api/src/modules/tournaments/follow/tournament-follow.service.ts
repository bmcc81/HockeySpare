import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { venueForArena } from '../tournament-calendar';
import {
  FollowEmailBase,
  FollowLang,
  confirmationEmail,
  normalizeLang,
  reminderEmail,
  unsubscribeUrl,
} from './follow-emails';

/** How far ahead of a game the reminder goes out. */
export const REMINDER_LEAD_MINUTES = 180;
const MAX_FOLLOWS_PER_EMAIL_PER_TOURNAMENT = 5;
const CONFIRMATION_RESEND_MINUTES = 10;
const IP_LIMIT = 10;
const IP_WINDOW_MS = 60 * 60 * 1000;

export type FollowResult =
  | { status: 'confirmation_sent'; emailConfigured: boolean }
  | { status: 'already_following'; emailConfigured: boolean }
  | { status: 'confirmation_recently_sent'; emailConfigured: boolean }
  | { status: 'email_failed'; emailConfigured: boolean };

@Injectable()
export class TournamentFollowService {
  private readonly logger = new Logger(TournamentFollowService.name);
  private readonly ipHits = new Map<string, number[]>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  private origin(): string {
    return (process.env.PUBLIC_BASE_URL ?? this.email.getAppUrl()).replace(/\/+$/, '');
  }

  /** At most IP_LIMIT sign-ups per hour from one address, so the form can't be used to spam people. */
  private checkIp(ip: string | undefined, now = Date.now()): void {
    if (!ip) return;
    const recent = (this.ipHits.get(ip) ?? []).filter((t) => now - t < IP_WINDOW_MS);
    if (recent.length >= IP_LIMIT) {
      throw new HttpException('Too many requests. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }
    recent.push(now);
    this.ipHits.set(ip, recent);
  }

  async follow(
    tournamentId: string,
    teamId: string,
    rawEmail: string,
    rawLang: unknown,
    ip?: string,
  ): Promise<FollowResult> {
    this.checkIp(ip);

    const email = rawEmail.trim().toLowerCase();
    const lang = normalizeLang(rawLang);
    const emailConfigured = this.email.isConfigured;

    const team = await this.prisma.tournamentTeam.findFirst({
      where: { id: teamId, tournamentId },
      select: { id: true, name: true, tournament: { select: { id: true, name: true } } },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const existing = await this.prisma.tournamentTeamFollow.findUnique({
      where: { teamId_email: { teamId, email } },
    });

    if (existing?.confirmedAt && !existing.unsubscribedAt) {
      return { status: 'already_following', emailConfigured };
    }

    if (!existing) {
      const count = await this.prisma.tournamentTeamFollow.count({ where: { tournamentId, email } });
      if (count >= MAX_FOLLOWS_PER_EMAIL_PER_TOURNAMENT) {
        throw new HttpException(
          'You are already following the maximum number of teams.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const now = new Date();
    if (
      existing?.confirmationSentAt &&
      now.getTime() - existing.confirmationSentAt.getTime() < CONFIRMATION_RESEND_MINUTES * 60_000 &&
      !existing.unsubscribedAt
    ) {
      return { status: 'confirmation_recently_sent', emailConfigured };
    }

    const token = existing?.token ?? randomBytes(24).toString('base64url');
    const follow = await this.prisma.tournamentTeamFollow.upsert({
      where: { teamId_email: { teamId, email } },
      create: { tournamentId, teamId, email, lang, token, confirmationSentAt: now },
      update: { lang, confirmedAt: null, unsubscribedAt: null, confirmationSentAt: now },
    });

    const built = confirmationEmail({
      origin: this.origin(),
      tournamentId,
      tournamentName: team.tournament.name,
      teamName: team.name,
      teamId,
      token: follow.token,
      lang,
    });

    try {
      await this.email.sendMail({ to: email, ...built });
    } catch (err) {
      // The mail server refused or is down. Say so, and let them try again right away.
      this.logger.warn(`Confirmation email to ${email} failed: ${(err as Error).message}`);
      await this.prisma.tournamentTeamFollow.update({
        where: { id: follow.id },
        data: { confirmationSentAt: null },
      });
      return { status: 'email_failed', emailConfigured };
    }

    return { status: 'confirmation_sent', emailConfigured };
  }

  /** Confirm an address from the link in the email. Returns the tournament to send the person to. */
  async confirm(token: string): Promise<string | null> {
    const follow = await this.prisma.tournamentTeamFollow.findUnique({ where: { token } });
    if (!follow) return null;

    if (!follow.confirmedAt || follow.unsubscribedAt) {
      await this.prisma.tournamentTeamFollow.update({
        where: { id: follow.id },
        data: { confirmedAt: follow.confirmedAt ?? new Date(), unsubscribedAt: null },
      });
    }

    return follow.tournamentId;
  }

  async unsubscribe(token: string): Promise<string | null> {
    const follow = await this.prisma.tournamentTeamFollow.findUnique({ where: { token } });
    if (!follow) return null;

    if (!follow.unsubscribedAt) {
      await this.prisma.tournamentTeamFollow.update({
        where: { id: follow.id },
        data: { unsubscribedAt: new Date() },
      });
    }

    return follow.tournamentId;
  }

  /**
   * Send the reminders that are due: games starting within REMINDER_LEAD_MINUTES
   * that a confirmed follower hasn't been reminded about yet (for that start
   * time, so a rescheduled game reminds again). Returns how many were sent.
   */
  async sendDueReminders(now: Date = new Date()): Promise<number> {
    const until = new Date(now.getTime() + REMINDER_LEAD_MINUTES * 60_000);

    const games = await this.prisma.tournamentGame.findMany({
      where: {
        startsAt: { gt: now, lte: until },
        status: 'SCHEDULED',
        stage: { not: 'EVENT' },
      },
      select: {
        id: true,
        tournamentId: true,
        gameNumber: true,
        division: true,
        startsAt: true,
        arenaName: true,
        homeTeamName: true,
        awayTeamName: true,
        homeTeamId: true,
        awayTeamId: true,
        tournament: {
          select: { name: true, venues: { select: { name: true, address: true } } },
        },
      },
    });

    let sent = 0;

    for (const game of games) {
      const teamIds = [game.homeTeamId, game.awayTeamId].filter((id): id is string => !!id);
      if (teamIds.length === 0) continue;

      const follows = await this.prisma.tournamentTeamFollow.findMany({
        where: {
          tournamentId: game.tournamentId,
          teamId: { in: teamIds },
          confirmedAt: { not: null },
          unsubscribedAt: null,
        },
        include: { team: { select: { name: true } } },
      });

      const venue = venueForArena(game.arenaName, game.tournament.venues);

      for (const follow of follows) {
        // Claim the reminder first (unique per follower + game + start time) so two
        // overlapping runs can't both send it.
        try {
          await this.prisma.tournamentGameReminder.create({
            data: { followId: follow.id, gameId: game.id, startsAt: game.startsAt },
          });
        } catch {
          continue; // already sent for this start time
        }

        const ctx: FollowEmailBase = {
          origin: this.origin(),
          tournamentId: game.tournamentId,
          tournamentName: game.tournament.name,
          teamName: follow.team.name,
          teamId: follow.teamId,
          token: follow.token,
          lang: normalizeLang(follow.lang) as FollowLang,
        };

        try {
          const built = reminderEmail(ctx, {
            id: game.id,
            gameNumber: game.gameNumber,
            division: game.division,
            startsAt: game.startsAt,
            arenaName: game.arenaName,
            address: venue?.address ?? null,
            homeTeamName: game.homeTeamName,
            awayTeamName: game.awayTeamName,
          });

          await this.email.sendMail({
            to: follow.email,
            ...built,
            headers: {
              'List-Unsubscribe': `<${unsubscribeUrl(ctx.origin, follow.token)}>`,
            },
          });
          sent += 1;
        } catch (err) {
          // Let the next run try again.
          await this.prisma.tournamentGameReminder
            .deleteMany({ where: { followId: follow.id, gameId: game.id, startsAt: game.startsAt } })
            .catch(() => undefined);
          this.logger.warn(`Reminder to ${follow.email} failed: ${(err as Error).message}`);
        }
      }
    }

    return sent;
  }
}
