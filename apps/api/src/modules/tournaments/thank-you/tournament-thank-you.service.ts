import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { TournamentsService } from '../tournaments.service';
import { thankYouEmail } from './thank-you-emails';
import { ThankYouRecipient, mergeRecipients } from './thank-you-recipients';

/** One send per tournament per hour, so a double click or a retry can't email everyone twice. */
const COOLDOWN_MS = 60 * 60 * 1000;

export interface ThankYouPreview {
  recipients: number;
  emailConfigured: boolean;
}

export interface ThankYouResult {
  sent: number;
  failed: number;
}

@Injectable()
export class TournamentThankYouService {
  private readonly logger = new Logger(TournamentThankYouService.name);
  private readonly lastSent = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly tournaments: TournamentsService,
  ) {}

  private origin(): string {
    return (process.env.PUBLIC_BASE_URL ?? this.email.getAppUrl()).replace(/\/+$/, '');
  }

  private async recipients(tournamentId: string): Promise<ThankYouRecipient[]> {
    const [follows, signups] = await Promise.all([
      this.prisma.tournamentTeamFollow.findMany({
        where: { tournamentId, confirmedAt: { not: null }, unsubscribedAt: null },
        select: { email: true, lang: true },
      }),
      this.prisma.tournamentVolunteerSignup.findMany({
        where: { shift: { tournamentId }, email: { not: null } },
        select: { email: true, name: true },
      }),
    ]);

    return mergeRecipients(follows, signups);
  }

  async preview(userId: string, tournamentId: string): Promise<ThankYouPreview> {
    await this.tournaments.assertCanManageTournament(userId, tournamentId);
    const recipients = await this.recipients(tournamentId);

    return { recipients: recipients.length, emailConfigured: this.email.isConfigured };
  }

  async send(
    userId: string,
    tournamentId: string,
    note: string | undefined,
    now = Date.now(),
  ): Promise<ThankYouResult> {
    const tournament = await this.tournaments.assertCanManageTournament(userId, tournamentId);

    const last = this.lastSent.get(tournamentId);
    if (last !== undefined && now - last < COOLDOWN_MS) {
      throw new HttpException(
        'The thank-you email was already sent a moment ago.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    this.lastSent.set(tournamentId, now);

    const recipients = await this.recipients(tournamentId);
    const origin = this.origin();
    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const mail = thankYouEmail({
        origin,
        tournamentId,
        tournamentName: tournament.name,
        lang: recipient.lang,
        name: recipient.name,
        note: note?.trim() || null,
      });

      try {
        await this.email.sendMail({
          to: recipient.email,
          subject: mail.subject,
          text: mail.text,
          html: mail.html,
        });
        sent += 1;
      } catch (err) {
        failed += 1;
        this.logger.warn(`Thank-you email to ${recipient.email} failed: ${(err as Error).message}`);
      }
    }

    this.logger.log(`Thank-you for ${tournamentId}: ${sent} sent, ${failed} failed.`);
    return { sent, failed };
  }
}
