import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Tournament } from '@hockeyspare/contracts';
import { TournamentsApiService } from '../../core/services/tournaments-api.service';

@Component({
  selector: 'app-tournaments-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './tournaments-list.html',
})
export class TournamentsListComponent implements OnInit {
  private readonly tournamentsApi = inject(TournamentsApiService);

  tournaments = signal<Tournament[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.tournamentsApi.listMine().subscribe({
      next: (tournaments) => {
        this.tournaments.set(tournaments);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load tournaments.');
        this.loading.set(false);
      },
    });
  }

  trackByTournamentId(_index: number, tournament: Tournament): string {
    return tournament.id;
  }
}
