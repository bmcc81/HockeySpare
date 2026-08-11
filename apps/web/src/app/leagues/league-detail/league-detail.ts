import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, signal, computed } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AddLeagueTeamMemberInput,
  BulkAddLeagueTeamMembersResult,
  LeagueDto,
  LeagueStandingRow,
  TeamDto,
  TeamGameDto,
  LeagueArenaDto,
  TeamMember,
  TeamRole,
} from '@hockeyspare/contracts';
import { LeaguesApiService } from '../../core/services/leagues-api.service';
import { AuthStateService } from '../../auth/auth-state.service';

type ParsedRosterRow = AddLeagueTeamMemberInput & {
  raw: string;
  valid: boolean;
  error: string | null;
};

const ROSTER_HEADER_NAMES = new Set([
  'name',
  'player',
  'player name',
  'displayname',
  'full name',
]);

function stripQuotes(value: string): string {
  const trimmed = value.trim();

  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function normalizeRosterPosition(
  value: string | undefined,
): 'GOALIE' | 'DEFENSE' | 'FORWARD' | null {
  const normalized = (value ?? '').trim().toUpperCase();

  if (['G', 'GOALIE', 'GOALTENDER'].includes(normalized)) {
    return 'GOALIE';
  }

  if (['D', 'DEFENSE', 'DEFENCE', 'DEFENSEMAN'].includes(normalized)) {
    return 'DEFENSE';
  }

  if (['F', 'FORWARD'].includes(normalized)) {
    return 'FORWARD';
  }

  return null;
}

function normalizeRosterMemberType(
  value: string | undefined,
): 'REGULAR' | 'SPARE' {
  const normalized = (value ?? '').trim().toUpperCase();

  return ['S', 'SPARE'].includes(normalized) ? 'SPARE' : 'REGULAR';
}

function parseRosterText(text: string): ParsedRosterRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [];
  }

  const delimiter = lines.some((line) => line.includes('\t')) ? '\t' : ',';

  const firstCell = stripQuotes(
    lines[0].split(delimiter)[0] ?? '',
  ).toLowerCase();
  const dataLines = ROSTER_HEADER_NAMES.has(firstCell) ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const cells = line.split(delimiter).map(stripQuotes);
    const displayName = cells[0] ?? '';
    const email = (cells[1] ?? '').toLowerCase();
    const phone = cells[2] || null;
    const position = normalizeRosterPosition(cells[3]);
    const memberType = normalizeRosterMemberType(cells[4]);

    let error: string | null = null;

    if (!displayName) {
      error = 'Missing player name';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      error = 'Missing or invalid email';
    }

    return {
      raw: line,
      displayName,
      email,
      phone,
      position,
      memberType,
      role: 'PLAYER',
      notifyByEmail: true,
      valid: error === null,
      error,
    };
  });
}

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
  private readonly router = inject(Router);
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
  standingsCollapsed = signal(false);

  standings = signal<LeagueStandingRow[]>([]);
  standingsLoading = signal(false);
  standingsError = signal<string | null>(null);

  deletingGameId = signal<string | null>(null);

  arenaSuccess = signal<string | null>(null);
  deletingArenaId = signal<string | null>(null);

  memberTeamId = signal<string | null>(null);
  savingMember = signal(false);
  memberError = signal<string | null>(null);
  memberSuccess = signal<string | null>(null);

  rosterImportTeamId = signal<string | null>(null);
  rosterImportText = signal('');
  savingRosterImport = signal(false);
  rosterImportError = signal<string | null>(null);
  rosterImportResult = signal<BulkAddLeagueTeamMembersResult | null>(null);

  parsedRosterRows = computed(() => parseRosterText(this.rosterImportText()));

  validParsedRosterRows = computed(() =>
    this.parsedRosterRows().filter((row) => row.valid),
  );

  savingRoleMemberId = signal<string | null>(null);
  roleError = signal<string | null>(null);
  roleSuccess = signal<string | null>(null);

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
    notifyBySms: [false],
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

  toggleStandingsCollapsed(): void {
    this.standingsCollapsed.update((collapsed) => !collapsed);
  }

  ngOnInit(): void {
    this.setupAutoGameTitle();
    this.load();
    this.loadStandings();
  }

  canManageLeague = computed(() => {
    const userId = this.authState.user()?.id;
    const league = this.league();

    if (!userId || !league) {
      return false;
    }

    if (this.authState.isAdmin()) {
      return true;
    }

    return (
      league.members?.some(
        (member) =>
          member.userId === userId && member.role === 'LEAGUE_MANAGER',
      ) ?? false
    );
  });

  manageTeam(team: TeamDto): void {
    if (!this.canManageTeam(team)) {
      this.error.set('You do not have permission to manage this team.');
      return;
    }

    this.router.navigate(['/my-team'], {
      queryParams: {
        teamId: team.id,
        leagueId: this.leagueId,
        leagueManager: this.canManageLeague() ? 'true' : null,
      },
    });
  }

  canManageTeam(team: TeamDto): boolean {
    const userId = this.authState.user()?.id;

    if (!userId) {
      return false;
    }

    if (this.canManageLeague()) {
      return true;
    }

    const ownsTeam = team.createdById === userId;

    const isTeamManager =
      team.members?.some(
        (member) =>
          member.userId === userId &&
          member.isActive !== false &&
          (member.role === 'CAPTAIN' || member.role === 'GENERAL_MANAGER'),
      ) ?? false;

    return ownsTeam || isTeamManager;
  }

  private teamById(teamId?: string | null): TeamDto | undefined {
    if (!teamId) {
      return undefined;
    }

    return this.teams().find((team) => team.id === teamId);
  }

  canManageTeamById(teamId?: string | null): boolean {
    const team = this.teamById(teamId);

    return !!team && this.canManageTeam(team);
  }

  canManageAnyTeam(): boolean {
    return this.teams().some((team) => this.canManageTeam(team));
  }

  canManageSelectedGameTeam(): boolean {
    return this.canManageTeamById(this.gameForm.controls.teamId.value);
  }

  canDeleteGame(game: TeamGameDto): boolean {
    return this.canManageTeamById(game.teamId);
  }

  isPastGame(game: TeamGameDto): boolean {
    return new Date(game.startsAt).getTime() < Date.now();
  }

  manageableTeams = computed(() =>
    this.teams().filter((team) => this.canManageTeam(team)),
  );

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

  loadStandings(): void {
    if (!this.leagueId) {
      return;
    }

    this.standingsLoading.set(true);
    this.standingsError.set(null);

    this.leaguesApi.getStandings(this.leagueId).subscribe({
      next: (standings) => {
        this.standings.set(standings);
        this.standingsLoading.set(false);
      },
      error: () => {
        this.standingsError.set('Could not load standings.');
        this.standingsLoading.set(false);
      },
    });
  }

  addTeam(): void {
    if (!this.canManageLeague()) {
      this.teamError.set('Only a league manager can add teams.');
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
    if (!this.canManageLeague()) {
      this.arenaError.set('Only a league manager can manage arenas.');
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
    if (!this.canManageLeague()) {
      this.arenaSuccess.set(null);
      this.arenaError.set('Only a league manager can delete arenas.');
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
    if (!this.canManageSelectedGameTeam()) {
      this.gameSuccess.set(null);
      this.gameError.set('You can only add games for teams you manage.');
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
    if (!this.canDeleteGame(game)) {
      this.gameSuccess.set(null);
      this.gameError.set('You can only delete games for teams you manage.');
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
    this.cancelRosterImport();

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
      notifyBySms: false,
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

    if (!this.canManageTeamById(teamId)) {
      this.memberError.set('You can only add players to teams you manage.');
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
        notifyBySms: !!value.notifyBySms,
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

  openRosterImport(team: TeamDto): void {
    this.cancelAddMember();

    this.rosterImportTeamId.set(team.id);
    this.rosterImportText.set('');
    this.rosterImportError.set(null);
    this.rosterImportResult.set(null);
  }

  cancelRosterImport(): void {
    this.rosterImportTeamId.set(null);
    this.rosterImportText.set('');
    this.rosterImportError.set(null);
    this.rosterImportResult.set(null);
  }

  updateRosterImportText(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.rosterImportText.set(textarea.value);
    this.rosterImportResult.set(null);
  }

  trackByParsedRosterRow(index: number, row: ParsedRosterRow): string {
    return `${index}:${row.email}`;
  }

  submitRosterImport(): void {
    const teamId = this.rosterImportTeamId();

    if (!teamId) {
      this.rosterImportError.set('Select a team first.');
      return;
    }

    if (!this.canManageTeamById(teamId)) {
      this.rosterImportError.set(
        'You can only import players to teams you manage.',
      );
      return;
    }

    const validRows = this.validParsedRosterRows();

    if (this.savingRosterImport()) {
      return;
    }

    if (validRows.length === 0) {
      this.rosterImportError.set(
        'Paste at least one row with a name and email.',
      );
      return;
    }

    this.savingRosterImport.set(true);
    this.rosterImportError.set(null);
    this.rosterImportResult.set(null);

    this.leaguesApi
      .bulkAddTeamMembers(
        this.leagueId,
        teamId,
        validRows.map(({ displayName, email, phone, position, memberType, role, notifyByEmail }) => ({
          displayName,
          email,
          phone,
          position,
          memberType,
          role,
          notifyByEmail,
        })),
      )
      .subscribe({
        next: (result) => {
          this.teams.update((teams) =>
            teams.map((existingTeam) =>
              existingTeam.id === teamId
                ? {
                    ...existingTeam,
                    members: [
                      ...(existingTeam.members ?? []),
                      ...result.created,
                    ].sort((a, b) => a.displayName.localeCompare(b.displayName)),
                  }
                : existingTeam,
            ),
          );

          this.rosterImportResult.set(result);
          this.rosterImportText.set('');
          this.savingRosterImport.set(false);
        },
        error: (err) => {
          this.rosterImportError.set(
            err?.error?.message || 'Could not import roster for this team.',
          );
          this.savingRosterImport.set(false);
        },
      });
  }

  updateTeamMemberRole(team: TeamDto, member: TeamMember, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const role = select.value as TeamRole;

    if (!this.canManageTeam(team)) {
      this.roleSuccess.set(null);
      this.roleError.set('You do not have permission to update roles.');
      select.value = member.role ?? 'PLAYER';
      return;
    }

    if (role === member.role) {
      return;
    }

    this.savingRoleMemberId.set(member.id);
    this.roleError.set(null);
    this.roleSuccess.set(null);

    this.leaguesApi
      .updateTeamMemberRole(this.leagueId, team.id, member.id, role)
      .subscribe({
        next: (updatedMember) => {
          this.teams.update((teams) =>
            teams.map((existingTeam) =>
              existingTeam.id === team.id
                ? {
                    ...existingTeam,
                    members: (existingTeam.members ?? []).map(
                      (existingMember) =>
                        existingMember.id === member.id
                          ? {
                              ...existingMember,
                              role: updatedMember.role,
                            }
                          : existingMember,
                    ),
                  }
                : existingTeam,
            ),
          );

          this.roleSuccess.set(
            `${member.displayName} is now ${this.roleLabel(updatedMember.role ?? 'PLAYER')}.`,
          );
          this.savingRoleMemberId.set(null);
        },
        error: (err) => {
          this.roleError.set(
            err?.error?.message || 'Could not update player role.',
          );
          this.savingRoleMemberId.set(null);
          select.value = member.role ?? 'PLAYER';
        },
      });
  }

  roleLabel(role: TeamRole | undefined | null): string {
    switch (role) {
      case 'GENERAL_MANAGER':
        return 'General Manager';
      case 'CAPTAIN':
        return 'Captain';
      default:
        return 'Player';
    }
  }

  openScoreSheet(game: TeamGameDto): void {
    this.router.navigate(['/score-sheets', 'games', game.id], {
      queryParams: {
        leagueId: this.leagueId,
        teamId: game.teamId,
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
