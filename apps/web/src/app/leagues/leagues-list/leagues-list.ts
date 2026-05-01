import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
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

  leagueSearch = signal('');
  seasonFilter = signal('');

  filteredLeagues = computed(() => {
    const search = this.leagueSearch().trim().toLowerCase();
    const season = this.seasonFilter().trim().toLowerCase();

    return this.leagues().filter((league) => {
      const matchesSearch =
        !search ||
        league.name.toLowerCase().includes(search) ||
        (league.season ?? '').toLowerCase().includes(search);

      const matchesSeason =
        !season || (league.season ?? '').toLowerCase() === season;

      return matchesSearch && matchesSeason;
    });
  });

  seasons = computed(() => {
    const uniqueSeasons = new Set<string>();

    for (const league of this.leagues()) {
      if (league.season) {
        uniqueSeasons.add(league.season);
      }
    }

    return [...uniqueSeasons].sort().reverse();
  });

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

  setLeagueSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.leagueSearch.set(input.value);
  }

  setSeasonFilter(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.seasonFilter.set(select.value);
  }

  clearFilters(): void {
    this.leagueSearch.set('');
    this.seasonFilter.set('');
  }

  trackByLeagueId(_index: number, league: LeagueDto): string {
    return league.id;
  }
}