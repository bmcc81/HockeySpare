import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/t.pipe';
import { TournamentsApiService } from '../../../core/services/tournaments-api.service';

/**
 * Organizer tool for after the final: one thank-you email to everyone who
 * followed a team or volunteered, with an optional personal note on top.
 */
@Component({
  selector: 'app-thank-you-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './thank-you-manager.html',
})
export class ThankYouManagerComponent implements OnInit {
  private readonly api = inject(TournamentsApiService);
  private readonly i18n = inject(I18nService);

  @Input({ required: true }) tournamentId!: string;

  recipients = signal<number | null>(null);
  emailConfigured = signal(true);
  note = '';
  sending = signal(false);
  result = signal<{ sent: number; failed: number } | null>(null);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.api.getThankYouPreview(this.tournamentId).subscribe({
      next: (preview) => {
        this.recipients.set(preview.recipients);
        this.emailConfigured.set(preview.emailConfigured);
      },
      error: () => this.error.set(this.i18n.t('Could not count the people to thank.')),
    });
  }

  send(): void {
    const count = this.recipients() ?? 0;

    if (
      this.sending() ||
      count === 0 ||
      !window.confirm(
        this.i18n.t('Send the thank-you email to {count} people? This cannot be undone.', { count }),
      )
    ) {
      return;
    }

    this.sending.set(true);
    this.error.set(null);

    this.api.sendThankYou(this.tournamentId, this.note.trim() || undefined).subscribe({
      next: (result) => {
        this.result.set(result);
        this.sending.set(false);
      },
      error: (err) => {
        this.error.set(
          (err as { error?: { message?: string } })?.error?.message ||
            this.i18n.t('Could not send the thank-you email.'),
        );
        this.sending.set(false);
      },
    });
  }
}
