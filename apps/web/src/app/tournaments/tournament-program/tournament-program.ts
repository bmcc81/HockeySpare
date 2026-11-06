import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Tournament, TournamentGame, TournamentTeam } from '@hockeyspare/contracts';
import { TournamentsApiService } from '../../core/services/tournaments-api.service';
import { QrCodeComponent } from '../shared/qr-code/qr-code';
import { TranslatePipe, LocalDatePipe } from '../../core/i18n/t.pipe';
import { I18nService } from '../../core/i18n/i18n.service';

@Component({
  selector: 'app-tournament-program',
  standalone: true,
  imports: [CommonModule, QrCodeComponent, TranslatePipe, LocalDatePipe],
  templateUrl: './tournament-program.html',
})
export class TournamentProgramComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly tournamentsApi = inject(TournamentsApiService);
  private readonly i18n = inject(I18nService);

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
        this.error.set(this.i18n.t('This tournament could not be found.'));
        this.loading.set(false);
      },
    });
  }

  gamesByDay(): { day: string; games: TournamentGame[] }[] {
    const games = [...(this.tournament()?.games ?? [])].sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime() ||
        Number(b.stage === 'EVENT') - Number(a.stage === 'EVENT'),
    );

    const groups = new Map<string, TournamentGame[]>();

    for (const game of games) {
      const day = new Date(game.startsAt).toLocaleDateString(this.i18n.locale(), {
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

  tournamentQrValue(): string {
    return `${window.location.origin}/tournaments/${this.tournamentId}`;
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
