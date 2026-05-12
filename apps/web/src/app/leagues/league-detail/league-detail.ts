import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, signal, computed } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  LeagueDto,
  TeamDto,
  TeamGameDto,
  LeagueArenaDto,
} from '@hockeyspare/contracts';
import { LeaguesApiService } from '../../core/services/leagues-api.service';
import { AuthStateService } from '../../auth/auth-state.service';

@Component({
  selector: 'app-league-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  providers: [DatePipe],
  templateUrl: './league-detail.html',
  styleUrl: './league-detail.scss',
})
export class LeagueDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly leaguesApi = inject(LeaguesApiService);
  private readonly authState = inject(AuthStateService);
  private readonly datePipe = inject(DatePipe);

  leagueId = this.route.snapshot.paramMap.get('id') ?? '';

  league = signal<LeagueDto | null>(null);
  teams = signal<TeamDto[]>([]);
  games = signal<TeamGameDto[]>([]);

  loading = signal(false);
  savingTeam = signal(false);
  savingGame = signal(false);

  error = signal<string | null>(null);
  teamError = signal<string | null>(null);
  gameSuccess = signal<string | null>(null);
  gameError = signal<string | null>(null);

  teamSearch = signal('');
  scheduleSearch = signal('');
  scheduleTeamId = signal('');
  scheduleView = signal<'ALL' | 'UPCOMING' | 'PAST'>('UPCOMING');

  arenas = signal<LeagueArenaDto[]>([]);
  savingArena = signal(false);
  arenaError = signal<string | null>(null);

  teamsCollapsed = signal(false);
  arenasCollapsed = signal(false);

  deletingGameId = signal<string | null>(null);

  arenaSuccess = signal<string | null>(null);
  deletingArenaId = signal<string | null>(null);

  memberTeamId = signal<string | null>(null);
  savingMember = signal(false);
  memberError = signal<string | null>(null);
  memberSuccess = signal<string | null>(null);

  getFormattedDate(date: string): string | null {
    return this.datePipe.transform(date, 'short');
  }

  teamForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
  });

  arenaForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    address: [''],
  });

  memberForm = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    position: ['FORWARD'],
    memberType: ['REGULAR'],
    role: ['PLAYER'],
    notifyByEmail: [true],
  });

  gameForm = this.fb.group({
    teamId: ['', [Validators.required]],
    title: ['', [Validators.required, Validators.minLength(2)]],
    startsAt: ['', [Validators.required]],
    arena: [''],
    opponentTeamId: this.fb.control<string | null>(null),
    opponent: [''],
    notes: [''],
  });

  toggleTeamsCollapsed(): void {
    this.teamsCollapsed.update((collapsed) => !collapsed);
  }

  toggleArenasCollapsed(): void {
    this.arenasCollapsed.update((collapsed) => !collapsed);
  }

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

    const isLeagueManager =
      league.members?.some(
        (member) =>
          member.userId === userId && member.role === 'LEAGUE_MANAGER',
      ) ?? false;

    const managesAnyTeam =
      league.teams?.some((team) => {
        const ownsTeam = team.createdById === userId;

        const isTeamManager =
          team.members?.some(
            (member) =>
              member.userId === userId &&
              member.isActive !== false &&
              (member.role === 'CAPTAIN' || member.role === 'GENERAL_MANAGER'),
          ) ?? false;

        return ownsTeam || isTeamManager;
      }) ?? false;

    return isLeagueManager || managesAnyTeam;
  });

  teamNameById = computed(() => {
    const map = new Map<string, string>();

    for (const team of this.teams()) {
      map.set(team.id, team.name);
    }

    return map;
  });

  arenaAddressByName = computed(() => {
    const map = new Map<string, string>();

    for (const arena of this.arenas()) {
      if (arena.address) {
        map.set(arena.name, arena.address);
      }
    }

    return map;
  });

  gameRows = computed(() =>
    this.games().map((game) => {
      const arenaValue = (game as any).arena;
      const arenaName =
        typeof arenaValue === 'string'
          ? arenaValue
          : (arenaValue?.name ?? null);

      const arenaAddress =
        typeof arenaValue === 'string'
          ? arenaValue
            ? (this.arenaAddressByName().get(arenaValue) ?? null)
            : null
          : (arenaValue?.address ?? null);

      const opponentTeam = (game as any).opponentTeam;
      const opponentTeamName = opponentTeam?.name ?? null;
      const opponentName = opponentTeamName ?? game.opponent ?? null;

      return {
        ...game,
        arena: arenaName,
        address: arenaAddress,
        opponent: opponentName,
        opponentTeamId: (game as any).opponentTeamId ?? null,
        opponentTeamName,
        teamName: this.teamNameById().get(game.teamId) ?? 'Unknown team',
      };
    }),
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

      const matchesTeam =
        !teamId || game.teamId === teamId || game.opponentTeamId === teamId;

      const matchesSearch =
        !search ||
        game.title.toLowerCase().includes(search) ||
        game.teamName.toLowerCase().includes(search) ||
        (game.opponent ?? '').toLowerCase().includes(search) ||
        (game.arena ?? '').toLowerCase().includes(search) ||
        (game.address ?? '').toLowerCase().includes(search) ||
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
        const arenas = league.arenas ?? [];

        this.league.set(league);
        this.teams.set(teams);
        this.games.set(this.sortGames(games));
        this.arenas.set(
          [...arenas].sort((a, b) => a.name.localeCompare(b.name)),
        );

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

  addArena(): void {
    if (!this.canManageTeams()) {
      this.arenaError.set('You do not have permission to manage arenas.');
      return;
    }

    if (this.arenaForm.invalid || this.savingArena()) {
      this.arenaForm.markAllAsTouched();
      return;
    }

    this.savingArena.set(true);
    this.arenaError.set(null);
    this.arenaSuccess.set(null);

    const value = this.arenaForm.getRawValue();

    this.leaguesApi
      .addArena(this.leagueId, {
        name: value.name.trim(),
        address: value.address.trim() || null,
      })
      .subscribe({
        next: (arena) => {
          this.arenas.update((arenas) =>
            [...arenas, arena].sort((a, b) => a.name.localeCompare(b.name)),
          );

          if (!this.gameForm.controls.arena.value) {
            this.gameForm.controls.arena.setValue(arena.name);
          }

          this.arenaForm.reset({
            name: '',
            address: '',
          });

          this.arenaSuccess.set(`Arena added: ${arena.name}`);
          this.savingArena.set(false);
        },
        error: (err) => {
          this.arenaError.set(err?.error?.message || 'Could not add arena.');
          this.savingArena.set(false);
        },
      });
  }

  deleteArena(arena: LeagueArenaDto): void {
    if (!this.canManageTeams()) {
      this.arenaSuccess.set(null);
      this.arenaError.set('You do not have permission to delete arenas.');
      return;
    }

    const confirmed = window.confirm(
      `Delete "${arena.name}" from this league? Existing games will keep their arena text, but this saved arena and address will be removed.`,
    );

    if (!confirmed) {
      return;
    }

    this.deletingArenaId.set(arena.id);
    this.arenaError.set(null);
    this.arenaSuccess.set(null);

    this.leaguesApi.deleteArena(this.leagueId, arena.id).subscribe({
      next: () => {
        this.arenas.update((arenas) =>
          arenas.filter((existingArena) => existingArena.id !== arena.id),
        );

        if (this.gameForm.controls.arena.value === arena.name) {
          this.gameForm.controls.arena.setValue('');
        }

        this.arenaSuccess.set(`Arena deleted: ${arena.name}`);
        this.deletingArenaId.set(null);
      },
      error: (err) => {
        this.arenaError.set(err?.error?.message || 'Could not delete arena.');
        this.deletingArenaId.set(null);
      },
    });
  }

  private setupAutoGameTitle(): void {
    this.gameForm.controls.teamId.valueChanges.subscribe(() => {
      this.updateGameTitle();
    });

    this.gameForm.controls.opponentTeamId.valueChanges.subscribe(() => {
      this.updateGameTitle();
    });

    this.gameForm.controls.opponent.valueChanges.subscribe(() => {
      this.updateGameTitle();
    });
  }

  private updateGameTitle(): void {
    const teamId = this.gameForm.controls.teamId.value;
    const opponentTeamId = this.gameForm.controls.opponentTeamId.value;
    const externalOpponent = this.gameForm.controls.opponent.value.trim();

    const teamName =
      this.teams().find((team) => team.id === teamId)?.name ?? '';

    const opponentTeamName =
      this.teams().find((team) => team.id === opponentTeamId)?.name ?? '';

    const opponent = opponentTeamName || externalOpponent;

    const title = teamName && opponent ? `${teamName} vs ${opponent}` : '';

    this.gameForm.controls.title.setValue(title, {
      emitEvent: false,
    });
  }

  private sortGames(games: TeamGameDto[]): TeamGameDto[] {
    return [...games].sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
  }

  addGame(): void {
    if (!this.canManageTeams()) {
      this.gameSuccess.set(null);
      this.gameError.set('You do not have permission to manage games.');
      return;
    }

    if (this.gameForm.invalid || this.savingGame()) {
      this.gameSuccess.set(null);
      this.gameError.set(null);
      this.gameForm.markAllAsTouched();
      return;
    }

    this.savingGame.set(true);
    this.gameError.set(null);
    this.gameSuccess.set(null);

    const value = this.gameForm.getRawValue();
    const startsAt = new Date(value.startsAt).toISOString();

    this.leaguesApi
      .addGame(this.leagueId, value.teamId, {
        title: value.title.trim(),
        startsAt,
        arena: value.arena.trim() || null,
        opponentTeamId: value.opponentTeamId || null,
        opponent: value.opponent.trim() || null,
        notes: value.notes.trim() || null,
      })
      .subscribe({
        next: (game) => {
          this.games.update((games) => this.sortGames([...games, game]));

          this.gameForm.reset({
            teamId: value.teamId,
            title: '',
            startsAt: '',
            arena: value.arena,
            opponentTeamId: null,
            opponent: '',
            notes: '',
          });

          this.gameForm.markAsPristine();
          this.gameForm.markAsUntouched();

          this.gameError.set(null);
          this.gameSuccess.set(`Game added: ${game.title}`);

          this.savingGame.set(false);
        },
        error: (err) => {
          this.gameSuccess.set(null);
          this.gameError.set(err?.error?.message || 'Could not add game.');
          this.savingGame.set(false);
        },
      });
  }

  deleteGame(game: TeamGameDto): void {
    if (!this.canManageTeams()) {
      this.gameSuccess.set(null);
      this.gameError.set('You do not have permission to delete games.');
      return;
    }

    const confirmed = window.confirm(
      `Delete "${game.title}" at ${this.getFormattedDate(game.startsAt)} from the schedule?`,
    );

    if (!confirmed) {
      return;
    }

    this.deletingGameId.set(game.id);
    this.gameError.set(null);
    this.gameSuccess.set(null);

    this.leaguesApi.deleteGame(this.leagueId, game.teamId, game.id).subscribe({
      next: () => {
        this.games.update((games) =>
          games.filter((existingGame) => existingGame.id !== game.id),
        );

        this.gameSuccess.set(
          `Game deleted: ${game.title} (${this.getFormattedDate(game.startsAt)})`,
        );
        this.deletingGameId.set(null);
      },
      error: (err) => {
        this.gameError.set(err?.error?.message || 'Could not delete game.');
        this.deletingGameId.set(null);
      },
    });
  }

  openAddMember(team: TeamDto): void {
    this.memberTeamId.set(team.id);
    this.memberError.set(null);
    this.memberSuccess.set(null);

    this.memberForm.reset({
      displayName: '',
      email: '',
      phone: '',
      position: 'FORWARD',
      memberType: 'REGULAR',
      role: 'PLAYER',
      notifyByEmail: true,
    });
  }

  cancelAddMember(): void {
    this.memberTeamId.set(null);
    this.memberError.set(null);
    this.memberSuccess.set(null);
  }

  addMemberToSelectedTeam(): void {
    const teamId = this.memberTeamId();

    if (!teamId) {
      this.memberError.set('Select a team first.');
      return;
    }

    if (!this.canManageTeams()) {
      this.memberError.set('You do not have permission to add players.');
      return;
    }

    if (this.memberForm.invalid || this.savingMember()) {
      this.memberForm.markAllAsTouched();
      return;
    }

    const value = this.memberForm.getRawValue();

    this.savingMember.set(true);
    this.memberError.set(null);
    this.memberSuccess.set(null);

    this.leaguesApi
      .addTeamMember(this.leagueId, teamId, {
        displayName: value.displayName.trim(),
        email: value.email.trim(),
        phone: value.phone.trim() || null,
        position: value.position as 'GOALIE' | 'DEFENSE' | 'FORWARD',
        memberType: value.memberType as 'REGULAR' | 'SPARE',
        role: value.role as 'PLAYER' | 'CAPTAIN' | 'GENERAL_MANAGER',
        notifyByEmail: !!value.notifyByEmail,
      })
      .subscribe({
        next: (member) => {
          this.teams.update((teams) =>
            teams.map((team) =>
              team.id === teamId
                ? {
                    ...team,
                    members: [...(team.members ?? []), member].sort((a, b) =>
                      a.displayName.localeCompare(b.displayName),
                    ),
                  }
                : team,
            ),
          );

          this.memberSuccess.set(
            `Invite sent to ${member.email ?? member.displayName}.`,
          );
          this.savingMember.set(false);

          this.memberForm.reset({
            displayName: '',
            email: '',
            phone: '',
            position: 'FORWARD',
            memberType: 'REGULAR',
            role: 'PLAYER',
            notifyByEmail: true,
          });
        },
        error: (err) => {
          this.memberError.set(
            err?.error?.message || 'Could not invite player to this team.',
          );
          this.savingMember.set(false);
        },
      });
  }

  trackGameById(_index: number, game: TeamGameDto): string {
    return game.id;
  }

  trackByTeamId(_index: number, team: TeamDto): string {
    return team.id;
  }

  trackArenaById(_index: number, arena: LeagueArenaDto): string {
    return arena.id;
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
