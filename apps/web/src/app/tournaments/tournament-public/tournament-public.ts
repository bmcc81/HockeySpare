import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Tournament } from '@hockeyspare/contracts';
import { TournamentsApiService } from '../../core/services/tournaments-api.service';

type TournamentTab = 'schedule' | 'rules';

@Component({
  selector: 'app-tournament-public',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tournament-public.html',
})
export class TournamentPublicComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly tournamentsApi = inject(TournamentsApiService);

  tournamentId = this.route.snapshot.paramMap.get('id') ?? '';

  tournament = signal<Tournament | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  activeTab = signal<TournamentTab>('schedule');

  ngOnInit(): void {
    this.tournamentsApi.getPublic(this.tournamentId).subscribe({
      next: (tournament) => {
        this.tournament.set(tournament);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('This tournament could not be found.');
        this.loading.set(false);
      },
    });
  }

  setTab(tab: TournamentTab): void {
    this.activeTab.set(tab);
  }
}
