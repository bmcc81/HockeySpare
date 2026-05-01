import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LeagueDto } from '@hockeyspare/contracts';
import { LeaguesApiService } from '../../core/services/leagues-api.service';

@Component({
  selector: 'app-leagues-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './leagues-list.html',
  styleUrl: './leagues-list.scss',
})
export class LeaguesListComponent {
  private readonly leaguesApi = inject(LeaguesApiService);

  leagues = signal<LeagueDto[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.leaguesApi.list().subscribe({
      next: (leagues) => {
        this.leagues.set(leagues);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load leagues.');
        this.loading.set(false);
      },
    });
  }

  trackByLeagueId(_index: number, league: LeagueDto): string {
    return league.id;
  }
}