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
import { AuthStateService } from '../../auth/auth-state.service';

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
  private readonly authState = inject(AuthStateService);

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

  teamSearch = signal('');
  scheduleSearch = signal('');
  scheduleTeamId = signal('');
  scheduleView = signal<'ALL' | 'UPCOMING' | 'PAST'>('UPCOMING');

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

  canManageTeams = computed(() => {
    const userId = this.authState.user()?.id;
    const league = this.league();

    if (!userId || !league) {
      return false;
    }

    return (
      league.teams?.some((team) =>
        team.members?.some(
          (member) =>
            member.userId === userId &&
            member.isActive !== false &&
            (member.role === 'CAPTAIN' || member.role === 'GENERAL_MANAGER'),
        ),
      ) ?? false
    );
  });

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

  filteredTeams = computed(() => {
    const search = this.teamSearch().trim().toLowerCase();

    if (!search) {
      return this.teams();
    }

    return this.teams().filter((team) =>
      team.name.toLowerCase().includes(search),
    );
  });

  filteredGameRows = computed(() => {
    const search = this.scheduleSearch().trim().toLowerCase();
    const teamId = this.scheduleTeamId();
    const view = this.scheduleView();
    const now = Date.now();

    return this.gameRows().filter((game) => {
      const gameTime = new Date(game.startsAt).getTime();

      const matchesTeam = !teamId || game.teamId === teamId;

      const matchesSearch =
        !search ||
        game.title.toLowerCase().includes(search) ||
        game.teamName.toLowerCase().includes(search) ||
        (game.opponent ?? '').toLowerCase().includes(search) ||
        (game.arena ?? '').toLowerCase().includes(search) ||
        (game.notes ?? '').toLowerCase().includes(search);

      const matchesView =
        view === 'ALL' ||
        (view === 'UPCOMING' && gameTime >= now) ||
        (view === 'PAST' && gameTime < now);

      return matchesTeam && matchesSearch && matchesView;
    });
  });

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
    if (!this.canManageTeams()) {
      this.teamError.set('You do not have permission to manage teams.');
      return;
    }

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
    if (!this.canManageTeams()) {
      this.gameError.set('You do not have permission to manage games.');
      return;
    }

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

  setTeamSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.teamSearch.set(input.value);
  }

  setScheduleSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.scheduleSearch.set(input.value);
  }

  setScheduleTeamId(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.scheduleTeamId.set(select.value);
  }

  setScheduleView(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.scheduleView.set(select.value as 'ALL' | 'UPCOMING' | 'PAST');
  }

  clearTeamFilters(): void {
    this.teamSearch.set('');
  }

  clearScheduleFilters(): void {
    this.scheduleSearch.set('');
    this.scheduleTeamId.set('');
    this.scheduleView.set('UPCOMING');
  }
}
