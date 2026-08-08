import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Tournament, TournamentGame, TournamentTeam } from '@hockeyspare/contracts';
import { TournamentsApiService } from '../../core/services/tournaments-api.service';
import { QrCodeComponent } from '../shared/qr-code/qr-code';

@Component({
  selector: 'app-tournament-program',
  standalone: true,
  imports: [CommonModule, QrCodeComponent],
  templateUrl: './tournament-program.html',
})
export class TournamentProgramComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly tournamentsApi = inject(TournamentsApiService);

  tournamentId = this.route.snapshot.paramMap.get('id') ?? '';

  tournament = signal<Tournament | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

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

  gamesByDay(): { day: string; games: TournamentGame[] }[] {
    const games = [...(this.tournament()?.games ?? [])].sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );

    const groups = new Map<string, TournamentGame[]>();

    for (const game of games) {
      const day = new Date(game.startsAt).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      const list = groups.get(day) ?? [];
      list.push(game);
      groups.set(day, list);
    }

    return Array.from(groups.entries()).map(([day, games]) => ({ day, games }));
  }

  gameQrValue(gameId: string): string {
    return `${window.location.origin}/tournaments/${this.tournamentId}#game-${gameId}`;
  }

  print(): void {
    window.print();
  }

  trackByGameId(_index: number, game: TournamentGame): string {
    return game.id;
  }

  trackByTeamId(_index: number, team: TournamentTeam): string {
    return team.id;
  }
}
