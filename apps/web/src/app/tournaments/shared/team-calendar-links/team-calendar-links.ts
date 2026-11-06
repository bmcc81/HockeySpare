import { NgIf } from '@angular/common';
import { Component, Input, inject, signal } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../../core/i18n/t.pipe';
import { I18nService } from '../../../core/i18n/i18n.service';
import { AuthStateService } from '../../../auth/auth-state.service';
import { TournamentsApiService } from '../../../core/services/tournaments-api.service';
import { googleSubscribeUrl, teamCalendarFeedUrl, webcalUrl } from '../calendar-links';

/**
 * "Add to Google Calendar" / Apple / Outlook / download buttons for one
 * team's tournament schedule. They all point at the same live feed, so the
 * calendar follows any schedule change.
 */
@Component({
  selector: 'app-team-calendar-links',
  standalone: true,
  imports: [TranslatePipe, NgIf],
  template: `
    <div class="d-flex flex-wrap gap-2 align-items-center">
      <a class="btn btn-sm btn-primary" [href]="google" target="_blank" rel="noopener noreferrer">
        {{ 'Add to Google Calendar' | t }}
      </a>
      <a class="btn btn-sm btn-outline-secondary" [href]="webcal">{{ 'Apple / Outlook' | t }}</a>
      <a class="btn btn-sm btn-outline-secondary" [href]="ics" download>{{ 'Download .ics' | t }}</a>
    </div>
    <div class="small text-secondary mt-1">
      {{ 'Your calendar updates by itself if the schedule changes (Google can take up to a day to refresh).' | t }}
    </div>

    <form class="mt-3" (submit)="follow($event, emailInput.value)">
      <label class="form-label small mb-1">{{ 'Get an email reminder before each game' | t }}</label>
      <div class="d-flex flex-wrap gap-2">
        <input
          #emailInput
          type="email"
          class="form-control form-control-sm"
          style="max-width: 240px"
          autocomplete="email"
          [placeholder]="'Your email' | t"
          [value]="initialEmail"
          required
        />
        <button type="submit" class="btn btn-sm btn-outline-primary" [disabled]="submitting()">
          {{ submitting() ? ('Sending...' | t) : ('Remind me' | t) }}
        </button>
      </div>
      <div
        class="small mt-1"
        *ngIf="message() as m"
        [class.text-success]="!isError()"
        [class.text-danger]="isError()"
      >{{ m | t: { email: sentTo() } }}</div>
    </form>
  `,
})
export class TeamCalendarLinksComponent {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly api = inject(TournamentsApiService);
  private readonly i18n = inject(I18nService);
  private readonly auth = inject(AuthStateService);

  submitting = signal(false);
  message = signal<string | null>(null);
  isError = signal(false);
  sentTo = signal('');

  /** Remembered from last time, else the signed-in account's address. */
  readonly initialEmail = this.rememberedEmail();

  private rememberedEmail(): string {
    try {
      return localStorage.getItem('hs.followEmail') || this.auth.user()?.email || '';
    } catch {
      return this.auth.user()?.email || '';
    }
  }

  follow(event: Event, rawEmail: string): void {
    event.preventDefault();
    const email = rawEmail.trim();

    if (!email || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.message.set(null);
    this.sentTo.set(email);

    this.api.followTeam(this.tournamentId, this.teamId, email, this.i18n.lang()).subscribe({
      next: (result) => {
        this.submitting.set(false);
        this.isError.set(false);

        try {
          localStorage.setItem('hs.followEmail', email);
        } catch {
          // fine without it
        }

        if (result.status === 'email_failed') {
          this.isError.set(true);
          this.message.set("We couldn't send the email just now. Please try again in a few minutes.");
        } else if (!result.emailConfigured) {
          this.isError.set(true);
          this.message.set("Email reminders aren't available yet. Please use the calendar buttons above.");
        } else if (result.status === 'already_following') {
          this.message.set("You're already getting reminders for this team.");
        } else if (result.status === 'confirmation_recently_sent') {
          this.message.set('We already sent you a link. Check your inbox (and your spam folder).');
        } else {
          this.message.set('Check your inbox: we sent a link to confirm {email}.');
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.isError.set(true);
        this.message.set(
          err?.status === 429
            ? 'Too many attempts. Please try again later.'
            : 'Could not sign you up. Check the email address and try again.',
        );
      },
    });
  }

  @Input({ required: true }) tournamentId!: string;
  @Input({ required: true }) teamId!: string;

  private get feed(): string {
    return teamCalendarFeedUrl(window.location.origin, this.tournamentId, this.teamId);
  }

  get google(): string {
    return googleSubscribeUrl(this.feed);
  }

  get ics(): string {
    return this.feed;
  }

  /** Angular treats webcal: as unsafe by default; this is our own feed URL. */
  get webcal(): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(webcalUrl(this.feed));
  }
}
