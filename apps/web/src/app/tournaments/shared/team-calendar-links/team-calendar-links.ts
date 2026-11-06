import { Component, Input, inject } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../../core/i18n/t.pipe';
import { googleSubscribeUrl, teamCalendarFeedUrl, webcalUrl } from '../calendar-links';

/**
 * "Add to Google Calendar" / Apple / Outlook / download buttons for one
 * team's tournament schedule. They all point at the same live feed, so the
 * calendar follows any schedule change.
 */
@Component({
  selector: 'app-team-calendar-links',
  standalone: true,
  imports: [TranslatePipe],
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
  `,
})
export class TeamCalendarLinksComponent {
  private readonly sanitizer = inject(DomSanitizer);

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
