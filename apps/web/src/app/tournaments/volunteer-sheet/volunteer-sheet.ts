import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Tournament, TournamentVolunteerShift } from '@hockeyspare/contracts';
import { I18nService } from '../../core/i18n/i18n.service';
import { LocalDatePipe, TranslatePipe } from '../../core/i18n/t.pipe';
import { TournamentsApiService } from '../../core/services/tournaments-api.service';
import { buildVolunteerGrid, openSpots } from '../shared/volunteer-groups';

/**
 * Organizer-only grid of volunteer shifts (day by arena by time) that prints
 * cleanly on one or two pages, with blank lines left for names still missing.
 */
@Component({
  selector: 'app-volunteer-sheet',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe, LocalDatePipe],
  templateUrl: './volunteer-sheet.html',
})
export class VolunteerSheetComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(TournamentsApiService);
  private readonly i18n = inject(I18nService);

  tournamentId = this.route.snapshot.paramMap.get('id') ?? '';

  tournament = signal<Tournament | null>(null);
  shifts = signal<TournamentVolunteerShift[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  showPhones = signal(false);

  days = computed(() => buildVolunteerGrid(this.shifts(), this.i18n.locale()));

  ngOnInit(): void {
    this.api.getPublic(this.tournamentId).subscribe({
      next: (tournament) => this.tournament.set(tournament),
      // The name is a nicety; the grid still works without it.
      error: () => undefined,
    });

    this.api.listVolunteerShifts(this.tournamentId).subscribe({
      next: (shifts) => {
        this.shifts.set(shifts);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(
          this.i18n.t('Could not load the volunteer shifts. Only organizers can open this sheet.'),
        );
        this.loading.set(false);
      },
    });
  }

  /** Blank lines to write a name on, one per spot that is still open. */
  blanks(shift: TournamentVolunteerShift): number[] {
    return Array.from({ length: openSpots(shift) }, (_, i) => i);
  }

  togglePhones(): void {
    this.showPhones.set(!this.showPhones());
  }

  print(): void {
    window.print();
  }

  trackById(_index: number, item: { id: string }): string {
    return item.id;
  }
}
