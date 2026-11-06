import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { TournamentFollowService } from './tournament-follow.service';

const TICK_MS = 5 * 60 * 1000;
const FIRST_TICK_DELAY_MS = 60 * 1000;

/**
 * Checks every few minutes for games that are about to start and sends the
 * reminders people asked for. The service records what it has sent, so a
 * restart or an overlapping run never sends the same reminder twice.
 */
@Injectable()
export class FollowReminderScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FollowReminderScheduler.name);
  private timer: NodeJS.Timeout | null = null;
  private first: NodeJS.Timeout | null = null;
  private running = false;

  constructor(private readonly follows: TournamentFollowService) {}

  onModuleInit(): void {
    if (process.env.NODE_ENV === 'test' || process.env.REMINDERS_DISABLED === 'true') {
      return;
    }

    this.first = setTimeout(() => void this.tick(), FIRST_TICK_DELAY_MS);
    this.timer = setInterval(() => void this.tick(), TICK_MS);
    this.first.unref();
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.first) clearTimeout(this.first);
    if (this.timer) clearInterval(this.timer);
  }

  async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;

    try {
      const sent = await this.follows.sendDueReminders();
      if (sent > 0) this.logger.log(`Sent ${sent} game reminder email(s).`);
    } catch (err) {
      this.logger.error(`Reminder run failed: ${(err as Error).message}`);
    } finally {
      this.running = false;
    }
  }
}
