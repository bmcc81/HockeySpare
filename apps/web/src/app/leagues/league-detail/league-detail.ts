import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LeagueDto, TeamDto, TeamGameDto } from '@hockeyspare/contracts';
import { LeaguesApiService } from '../../core/services/leagues-api.service';

@Component({
  selector: 'app-league-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './league-detail.html',
  styleUrl: './league-detail.scss',
})
export class LeagueDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly leaguesApi = inject(LeaguesApiService);

  leagueId = this.route.snapshot.paramMap.get('id') ?? '';

  league = signal<LeagueDto | null>(null);
  teams = signal<TeamDto[]>([]);
  games = signal<TeamGameDto[]>([]);

  loading = signal(false);
  savingTeam = signal(false);
  savingGame = signal(false);

  error = signal<string | null>(null);
  teamError = signal<string | null>(null);
  gameError = signal<string | null>(null);

  teamForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
  });

  gameForm = this.fb.group({
    teamId: ['', [Validators.required]],
    title: ['', [Validators.required, Validators.minLength(2)]],
    startsAt: ['', [Validators.required]],
    arena: [''],
    opponent: [''],
    notes: [''],
  });

  ngOnInit(): void {
    this.setupAutoGameTitle();
    this.load();
  }

  teamNameById = computed(() => {
    const map = new Map<string, string>();

    for (const team of this.teams()) {
      map.set(team.id, team.name);
    }

    return map;
  });

  gameRows = computed(() =>
    this.games().map((game) => ({
      ...game,
      teamName: this.teamNameById().get(game.teamId) ?? 'Unknown team',
    })),
  );

  load(): void {
    if (!this.leagueId) {
      this.error.set('Missing league ID.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.leaguesApi.getById(this.leagueId).subscribe({
      next: (league) => {
        const teams = league.teams ?? [];
        const games = teams.flatMap((team) => team.games ?? []);

        this.league.set(league);
        this.teams.set(teams);
        this.games.set(this.sortGames(games));
        this.updateGameTitle();
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load league.');
        this.loading.set(false);
      },
    });
  }

  addTeam(): void {
    if (this.teamForm.invalid || this.savingTeam()) {
      this.teamForm.markAllAsTouched();
      return;
    }

    this.savingTeam.set(true);
    this.teamError.set(null);

    const value = this.teamForm.getRawValue();

    this.leaguesApi
      .addTeam(this.leagueId, {
        name: value.name.trim(),
      })
      .subscribe({
        next: (team) => {
          this.teams.update((teams) =>
            [...teams, team].sort((a, b) => a.name.localeCompare(b.name)),
          );

          if (!this.gameForm.controls.teamId.value) {
            this.gameForm.controls.teamId.setValue(team.id);
          }

          this.teamForm.reset({
            name: '',
          });

          this.savingTeam.set(false);
        },
        error: () => {
          this.teamError.set('Could not add team.');
          this.savingTeam.set(false);
        },
      });
  }

  private setupAutoGameTitle(): void {
    this.gameForm.controls.teamId.valueChanges.subscribe(() => {
      this.updateGameTitle();
    });

    this.gameForm.controls.opponent.valueChanges.subscribe(() => {
      this.updateGameTitle();
    });
  }

  private updateGameTitle(): void {
    const teamId = this.gameForm.controls.teamId.value;
    const opponent = this.gameForm.controls.opponent.value.trim();

    const teamName =
      this.teams().find((team) => team.id === teamId)?.name ?? '';

    const title = teamName && opponent ? `${teamName} vs ${opponent}` : '';

    this.gameForm.controls.title.setValue(title, {
      emitEvent: false,
    });
  }

  addGame(): void {
    if (this.gameForm.invalid || this.savingGame()) {
      this.gameForm.markAllAsTouched();
      return;
    }

    this.savingGame.set(true);
    this.gameError.set(null);

    const value = this.gameForm.getRawValue();
    const startsAt = new Date(value.startsAt).toISOString();

    this.leaguesApi
      .addGame(this.leagueId, value.teamId, {
        title: value.title.trim(),
        startsAt,
        arena: value.arena.trim() || null,
        opponent: value.opponent.trim() || null,
        notes: value.notes.trim() || null,
      })
      .subscribe({
        next: (game) => {
          this.games.update((games) => this.sortGames([...games, game]));

          this.gameForm.patchValue({
            title: '',
            startsAt: '',
            arena: '',
            opponent: '',
            notes: '',
          });

          this.savingGame.set(false);
        },
        error: () => {
          this.gameError.set('Could not add game.');
          this.savingGame.set(false);
        },
      });
  }

  trackGameById(_index: number, game: TeamGameDto): string {
    return game.id;
  }

  trackByTeamId(_index: number, team: TeamDto): string {
    return team.id;
  }

  private sortGames(games: TeamGameDto[]): TeamGameDto[] {
    return [...games].sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
  }
}
