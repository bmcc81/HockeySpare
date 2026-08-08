import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Tournament, TournamentGame } from '@hockeyspare/contracts';
import { Subscription, interval, switchMap } from 'rxjs';
import { TournamentsApiService } from '../../core/services/tournaments-api.service';

const POLL_INTERVAL_MS = 15000;
const CLOCK_TICK_MS = 1000;

@Component({
  selector: 'app-tournament-scoreboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tournament-scoreboard.html',
})
export class TournamentScoreboardComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly tournamentsApi = inject(TournamentsApiService);

  private pollSubscription: Subscription | null = null;
  private clockIntervalId: ReturnType<typeof setInterval> | null = null;

  tournamentId = this.route.snapshot.paramMap.get('id') ?? '';

  tournament = signal<Tournament | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  now = signal(new Date());

  ngOnInit(): void {
    this.load();

    this.pollSubscription = interval(POLL_INTERVAL_MS)
      .pipe(switchMap(() => this.tournamentsApi.getPublic(this.tournamentId)))
      .subscribe({
        next: (tournament) => this.tournament.set(tournament),
      });

    this.clockIntervalId = setInterval(() => this.now.set(new Date()), CLOCK_TICK_MS);
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();

    if (this.clockIntervalId !== null) {
      clearInterval(this.clockIntervalId);
    }
  }

  private load(): void {
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

  liveGames(): TournamentGame[] {
    return (this.tournament()?.games ?? []).filter((g) => g.status === 'LIVE');
  }

  upcomingGames(): TournamentGame[] {
    const now = Date.now();

    return (this.tournament()?.games ?? [])
      .filter((g) => g.status === 'SCHEDULED' && new Date(g.startsAt).getTime() >= now)
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
      .slice(0, 6);
  }

  recentFinals(): TournamentGame[] {
    return (this.tournament()?.games ?? [])
      .filter((g) => g.status === 'FINAL')
      .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
      .slice(0, 4);
  }

  weatherAlert(): string | null {
    const alert = (this.tournament()?.announcements ?? []).find(
      (a) => a.type === 'WEATHER',
    );
    return alert?.body ?? null;
  }

  trackByGameId(_index: number, game: TournamentGame): string {
    return game.id;
  }
}
