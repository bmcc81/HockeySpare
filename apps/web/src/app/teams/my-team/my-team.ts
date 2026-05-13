import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MyTeamResponse,
  TeamMember,
  TeamGame,
  TeamGameAvailabilityStatus,
  UpcomingGame,
  PlayerStat,
} from '@hockeyspare/contracts';
import { TeamService } from '../../core/services/team';

@Component({
  selector: 'app-my-team',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  templateUrl: './my-team.html',
  styleUrl: './my-team.scss',
})
export class MyTeamComponent implements OnInit {
  private fb = inject(FormBuilder);
  private teamApi = inject(TeamService);
  private cdr = inject(ChangeDetectorRef);

  loading = false;
  error = '';
  team: MyTeamResponse | null = null;
  myStats: PlayerStat[] = [];

  availabilitySavingGameId: string | null = null;
  availabilityComposerGameId: string | null = null;
  availabilityComposerStatus: TeamGameAvailabilityStatus | null = null;

  statEditorMemberId: string | null = null;
  statsSavingMemberId: string | null = null;
  statsLoadingMemberId: string | null = null;
  statsSeasonHasRecord: boolean | null = null;

  creatingTeam = false;

  upcomingGames: UpcomingGame[] = [];
  upcomingGamesLoading = false;
  upcomingGamesError: string | null = null;

  notifyingGameId: string | null = null;
  notifySuccess: string | null = null;

  savingRoleMemberId = signal<string | null>(null);
  roleError = signal<string | null>(null);

  teamForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
  });

  memberForm = this.fb.group({
    displayName: ['', Validators.required],
    email: ['', Validators.email],
    phone: [''],
    position: ['FORWARD'],
    memberType: ['REGULAR' as 'REGULAR' | 'SPARE', Validators.required],
    notifyByApp: [true],
    notifyByEmail: [false],
  });

  availabilityForm = this.fb.group({
    note: ['', [Validators.maxLength(500)]],
  });

  statForm = this.fb.group({
    season: [
      `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      Validators.required,
    ],
    gamesPlayed: [0, [Validators.required, Validators.min(0)]],
    goals: [0, [Validators.required, Validators.min(0)]],
    assists: [0, [Validators.required, Validators.min(0)]],
    penaltyMins: [0, [Validators.required, Validators.min(0)]],
  });

  statsFilterForm = this.fb.group({
    season: [''],
    team: [''],
  });

  statsSortKey:
    | 'player'
    | 'season'
    | 'team'
    | 'gamesPlayed'
    | 'goals'
    | 'assists'
    | 'points'
    | 'penaltyMins' = 'season';

  statsSortDirection: 'asc' | 'desc' = 'desc';

  get filteredAndSortedMyStats(): PlayerStat[] {
    const seasonFilter = (this.statsFilterForm.get('season')?.value ?? '')
      .trim()
      .toLowerCase();

    const teamFilter = (this.statsFilterForm.get('team')?.value ?? '')
      .trim()
      .toLowerCase();

    const filtered = this.myStats.filter((stat: PlayerStat) => {
      const matchesSeason =
        !seasonFilter || stat.season.toLowerCase().includes(seasonFilter);

      const matchesTeam =
        !teamFilter || stat.team.name.toLowerCase().includes(teamFilter);

      return matchesSeason && matchesTeam;
    });

    return [...filtered].sort((a: PlayerStat, b: PlayerStat) => {
      const dir = this.statsSortDirection === 'asc' ? 1 : -1;

      const aPoints = a.goals + a.assists;
      const bPoints = b.goals + b.assists;

      const aPlayer = a.member?.displayName ?? '';
      const bPlayer = b.member?.displayName ?? '';

      switch (this.statsSortKey) {
        case 'player':
          return aPlayer.localeCompare(bPlayer) * dir;
        case 'season':
          return a.season.localeCompare(b.season) * dir;
        case 'team':
          return a.team.name.localeCompare(b.team.name) * dir;
        case 'gamesPlayed':
          return (a.gamesPlayed - b.gamesPlayed) * dir;
        case 'goals':
          return (a.goals - b.goals) * dir;
        case 'assists':
          return (a.assists - b.assists) * dir;
        case 'points':
          return (aPoints - bPoints) * dir;
        case 'penaltyMins':
          return (a.penaltyMins - b.penaltyMins) * dir;
        default:
          return 0;
      }
    });
  }

  setStatsSort(
    key:
      | 'player'
      | 'season'
      | 'team'
      | 'gamesPlayed'
      | 'goals'
      | 'assists'
      | 'points'
      | 'penaltyMins',
  ) {
    if (this.statsSortKey === key) {
      this.statsSortDirection =
        this.statsSortDirection === 'asc' ? 'desc' : 'asc';
      return;
    }

    this.statsSortKey = key;
    this.statsSortDirection =
      key === 'player' || key === 'team' ? 'asc' : 'desc';
  }

  statsSortIcon(
    key:
      | 'player'
      | 'season'
      | 'team'
      | 'gamesPlayed'
      | 'goals'
      | 'assists'
      | 'points'
      | 'penaltyMins',
  ): string {
    if (this.statsSortKey !== key) return '↕';
    return this.statsSortDirection === 'asc' ? '↑' : '↓';
  }

  ngOnInit(): void {
    this.reload();
    this.loadMyStats();

    this.statForm.controls.season.valueChanges.subscribe((season) => {
      if (!this.statEditorMemberId) return;

      const normalizedSeason = (season ?? '').trim();
      if (!normalizedSeason) return;

      this.loadMemberStatsIntoForm(this.statEditorMemberId, normalizedSeason);
    });
  }

  get regulars(): TeamMember[] {
    return this.team?.members.filter((m) => m.memberType === 'REGULAR') ?? [];
  }

  get spares(): TeamMember[] {
    return this.team?.members.filter((m) => m.memberType === 'SPARE') ?? [];
  }

  get myRole(): 'PLAYER' | 'CAPTAIN' | 'GENERAL_MANAGER' | null {
    return this.team?.myMembership?.role ?? null;
  }

  get canManageTeam(): boolean {
    return !!this.team?.canManageTeam;
  }

  private sortUpcomingGames(games: UpcomingGame[]): UpcomingGame[] {
    const now = Date.now();

    return games
      .filter((game) => new Date(game.startsAt).getTime() >= now)
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      );
  }

  private defaultSeason(): string {
    const year = new Date().getFullYear();
    return `${year}-${year + 1}`;
  }

  reload(): void {
    this.loading = true;
    this.error = '';
    this.upcomingGames = [];
    this.upcomingGamesError = null;
    this.cdr.detectChanges();

    this.teamApi.getMyTeam().subscribe({
      next: (team) => {
        this.team = {
          ...team,
          members: team?.members ?? [],
          games: team?.games ?? [],
          myMembership: team?.myMembership ?? null,
          canManageTeam: !!team?.canManageTeam,
        };

        this.teamForm.patchValue({
          name: team?.name ?? '',
        });

        this.loading = false;
        this.error = '';

        this.loadMyStats();
        this.loadUpcomingGames();

        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err?.status === 404) {
          this.team = null;
          this.loading = false;
          this.error = '';
          this.upcomingGames = [];
          this.upcomingGamesError = null;
          this.cdr.detectChanges();
          return;
        }

        console.error('Could not load team page:', err);
        this.error = 'Could not load your team.';
        this.loading = false;
        this.upcomingGames = [];
        this.cdr.detectChanges();
      },
    });
  }

  loadMyStats() {
    this.teamApi.getTeamStats().subscribe({
      next: (stats) => {
        this.myStats = stats ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('Could not load team stats:', err);
      },
    });
  }

  createMyTeam(): void {
    if (this.teamForm.invalid || this.creatingTeam) {
      this.teamForm.markAllAsTouched();
      return;
    }

    const raw = this.teamForm.getRawValue();
    const name = raw.name?.trim() ?? '';

    this.creatingTeam = true;
    this.error = '';

    this.teamApi
      .createMyTeam({
        name,
      })
      .subscribe({
        next: () => {
          this.creatingTeam = false;
          this.reload();
        },
        error: (err) => {
          this.creatingTeam = false;
          this.error = err?.error?.message || 'Could not create your team.';
          this.cdr.detectChanges();
        },
      });
  }

  saveTeamName() {
    if (!this.canManageTeam) {
      this.error = 'You do not have permission to update this team.';
      return;
    }

    if (this.teamForm.invalid) {
      this.teamForm.markAllAsTouched();
      return;
    }

    const raw = this.teamForm.getRawValue();

    this.teamApi
      .updateMyTeam({
        name: raw.name ?? '',
      })
      .subscribe({
        next: () => this.reload(),
        error: () => {
          this.error = 'Could not save team name.';
        },
      });
  }

  addMember() {
    if (!this.canManageTeam) {
      this.error = 'You do not have permission to add players.';
      return;
    }

    if (this.memberForm.invalid) {
      this.memberForm.markAllAsTouched();
      return;
    }

    const raw = this.memberForm.getRawValue();

    this.teamApi
      .addMember({
        displayName: raw.displayName ?? '',
        email: raw.email ?? '',
        phone: raw.phone ?? '',
        position: raw.position ?? 'FORWARD',
        memberType: raw.memberType ?? 'REGULAR',
        notifyByApp: !!raw.notifyByApp,
        notifyByEmail: !!raw.notifyByEmail,
      })
      .subscribe({
        next: () => {
          this.memberForm.reset({
            displayName: '',
            email: '',
            phone: '',
            position: 'FORWARD',
            memberType: 'REGULAR',
            notifyByApp: true,
            notifyByEmail: false,
          });
          this.reload();
        },
        error: () => {
          this.error = 'Could not add player.';
        },
      });
  }

  removeMember(memberId: string) {
    if (!this.canManageTeam) {
      this.error = 'You do not have permission to remove players.';
      return;
    }

    this.teamApi.removeMember(memberId).subscribe({
      next: () => this.reload(),
      error: () => {
        this.error = 'Could not remove player.';
      },
    });
  }

  notifyGame(game: UpcomingGame): void {
    if (!this.canManageTeam) {
      this.notifySuccess = null;
      this.error = 'You do not have permission to notify the team.';
      return;
    }

    const confirmed = window.confirm(
      `Send an availability email to each team member for "${game.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    this.notifyingGameId = game.id;
    this.notifySuccess = null;
    this.error = '';
    this.cdr.detectChanges();

    this.teamApi.notifyGame(game.id).subscribe({
      next: (result: any) => {
        this.notifyingGameId = null;

        const emailSentCount = result?.emailSentCount ?? 0;
        const skippedCount = result?.skippedAlreadyNotifiedCount ?? 0;

        this.notifySuccess =
          skippedCount > 0
            ? `Team notified for ${game.title}. Emails sent: ${emailSentCount}. Already notified: ${skippedCount}.`
            : `Team notified for ${game.title}. Emails sent: ${emailSentCount}.`;

        this.reload();
      },
      error: (err) => {
        this.notifyingGameId = null;
        this.notifySuccess = null;
        this.error = err?.error?.message || 'Could not send notifications.';
        this.cdr.detectChanges();
      },
    });
  }

  getMyAvailability(game: TeamGame): TeamGameAvailabilityStatus | null {
    const memberId = this.team?.myMembership?.id;
    if (!memberId) return null;

    return (
      game.availabilities?.find((a) => a.memberId === memberId)?.status ?? null
    );
  }

  getMyAvailabilityNote(game: TeamGame): string {
    const memberId = this.team?.myMembership?.id;
    if (!memberId) return '';

    return (
      game.availabilities?.find((a) => a.memberId === memberId)?.note ?? ''
    );
  }

  availabilityLabel(status: TeamGameAvailabilityStatus | null): string {
    switch (status) {
      case 'AVAILABLE':
        return 'Available';
      case 'UNAVAILABLE':
        return 'Can’t make it';
      case 'NEED_SPARE':
        return 'Need spare';
      default:
        return 'No response yet';
    }
  }

  availabilityBadgeClass(status: TeamGameAvailabilityStatus | null): string {
    switch (status) {
      case 'AVAILABLE':
        return 'text-bg-success';
      case 'UNAVAILABLE':
        return 'text-bg-warning';
      case 'NEED_SPARE':
        return 'text-bg-danger';
      default:
        return 'text-bg-secondary';
    }
  }

  private mapMyTeamGames(): UpcomingGame[] {
    const teamAsAny = this.team as any;

    return (this.team?.games ?? []).map((game: any) => ({
      id: game.id,
      title: game.title,
      startsAt: game.startsAt,
      arena: game.arena ?? null,
      opponent: game.opponent ?? null,
      opponentTeamId: game.opponentTeamId ?? null,
      opponentTeam: game.opponentTeam ?? null,
      notes: game.notes ?? null,
      teamId: game.teamId,
      teamName: this.team?.name ?? undefined,
      leagueId: teamAsAny?.league?.id ?? undefined,
      leagueName: teamAsAny?.league?.name ?? undefined,
      source: 'MY_TEAM',
      invites: game.invites ?? [],
      availabilities: game.availabilities ?? [],
    }));
  }

  private loadUpcomingGames(): void {
    this.upcomingGamesLoading = false;
    this.upcomingGamesError = null;
    this.upcomingGames = this.sortUpcomingGames(this.mapMyTeamGames());
    this.cdr.detectChanges();
  }

  trackByUpcomingGameId(
    _index: number,
    game: { id: string; source?: string },
  ): string {
    return `${game.source ?? 'MY_TEAM'}-${game.id}`;
  }

  canRespondToGame(game: { source?: string }): boolean {
    return game.source !== 'LEAGUE';
  }

  availabilityCount(
    game: TeamGame,
    status: TeamGameAvailabilityStatus,
  ): number {
    return game.availabilities?.filter((a) => a.status === status).length ?? 0;
  }

  setGameAvailability(
    gameId: string,
    status: TeamGameAvailabilityStatus,
    note?: string,
  ) {
    this.availabilitySavingGameId = gameId;
    this.error = '';

    this.teamApi.respondToGame(gameId, { status, note }).subscribe({
      next: () => {
        this.availabilitySavingGameId = null;
        this.reload();
      },
      error: () => {
        this.availabilitySavingGameId = null;
        this.error = 'Could not update your game status.';
        this.cdr.detectChanges();
      },
    });
  }

  markAvailable(gameId: string) {
    this.cancelAvailabilityComposer();
    this.setGameAvailability(gameId, 'AVAILABLE');
  }

  markUnavailable(gameId: string) {
    const game = this.team?.games.find((g) => g.id === gameId);
    this.openAvailabilityComposer(
      gameId,
      'UNAVAILABLE',
      game ? this.getMyAvailabilityNote(game) : '',
    );
  }

  requestSpare(gameId: string) {
    const game = this.team?.games.find((g) => g.id === gameId);
    this.openAvailabilityComposer(
      gameId,
      'NEED_SPARE',
      game ? this.getMyAvailabilityNote(game) : '',
    );
  }

  openAvailabilityComposer(
    gameId: string,
    status: TeamGameAvailabilityStatus,
    existingNote = '',
  ) {
    this.availabilityComposerGameId = gameId;
    this.availabilityComposerStatus = status;

    const defaultNote =
      status === 'NEED_SPARE'
        ? existingNote || 'I can’t make it and need a spare.'
        : existingNote || '';

    this.availabilityForm.patchValue({
      note: defaultNote,
    });
  }

  cancelAvailabilityComposer() {
    this.availabilityComposerGameId = null;
    this.availabilityComposerStatus = null;
    this.availabilityForm.reset({
      note: '',
    });
  }

  availabilityComposerTitle(): string {
    switch (this.availabilityComposerStatus) {
      case 'UNAVAILABLE':
        return 'Can’t make it';
      case 'NEED_SPARE':
        return 'Need a spare';
      default:
        return 'Game response';
    }
  }

  saveAvailabilityResponse() {
    if (!this.availabilityComposerGameId || !this.availabilityComposerStatus) {
      return;
    }

    const gameId = this.availabilityComposerGameId;
    const status = this.availabilityComposerStatus;
    const note = this.availabilityForm.getRawValue().note?.trim() || undefined;

    this.availabilitySavingGameId = gameId;
    this.error = '';

    this.teamApi.respondToGame(gameId, { status, note }).subscribe({
      next: (result: any) => {
        this.availabilitySavingGameId = null;
        this.cancelAvailabilityComposer();

        const spareNotification = result?.spareNotification;

        if (spareNotification?.spareInviteCount > 0) {
          const smsPart =
            spareNotification.spareSmsSentCount > 0
              ? ` Texts sent: ${spareNotification.spareSmsSentCount}.`
              : ' SMS pending sender approval.';

          this.notifySuccess =
            `Spare request sent. Emails: ${spareNotification.spareEmailSentCount}.` +
            smsPart;
        } else if (spareNotification?.spareSkippedAlreadyNotifiedCount > 0) {
          this.notifySuccess = `Spares were already notified for this game. Already notified: ${spareNotification.spareSkippedAlreadyNotifiedCount}.`;
        }

        this.reload();
      },
      error: () => {
        this.availabilitySavingGameId = null;
        this.error = 'Could not update your game status.';
        this.cdr.detectChanges();
      },
    });
  }

  loadMemberStatsIntoForm(memberId: string, season?: string) {
    this.statsLoadingMemberId = memberId;
    this.statsSeasonHasRecord = null;
    this.error = '';

    const fallbackSeason = season || this.defaultSeason();

    this.teamApi.getMemberStats(memberId, season).subscribe({
      next: (stat) => {
        if (stat) {
          this.statsSeasonHasRecord = true;

          this.statForm.patchValue(
            {
              season: stat.season ?? fallbackSeason,
              gamesPlayed: stat.gamesPlayed ?? 0,
              goals: stat.goals ?? 0,
              assists: stat.assists ?? 0,
              penaltyMins: stat.penaltyMins ?? 0,
            },
            { emitEvent: false },
          );
        } else {
          this.statsSeasonHasRecord = false;

          this.statForm.patchValue(
            {
              season: fallbackSeason,
              gamesPlayed: 0,
              goals: 0,
              assists: 0,
              penaltyMins: 0,
            },
            { emitEvent: false },
          );
        }

        this.statsLoadingMemberId = null;
        this.cdr.detectChanges();
      },
      error: () => {
        this.statsLoadingMemberId = null;
        this.statsSeasonHasRecord = null;
        this.error = 'Could not load player stats.';
        this.cdr.detectChanges();
      },
    });
  }

  openStatEditor(memberId: string) {
    this.statEditorMemberId = memberId;
    this.statsSeasonHasRecord = null;

    this.statForm.reset({
      season: this.defaultSeason(),
      gamesPlayed: 0,
      goals: 0,
      assists: 0,
      penaltyMins: 0,
    });

    this.loadMemberStatsIntoForm(memberId);
  }

  cancelStatEditor() {
    this.statEditorMemberId = null;
    this.statsSavingMemberId = null;
    this.statsLoadingMemberId = null;
    this.statsSeasonHasRecord = null;

    this.statForm.reset({
      season: this.defaultSeason(),
      gamesPlayed: 0,
      goals: 0,
      assists: 0,
      penaltyMins: 0,
    });
  }

  saveMemberStats(memberId: string) {
    if (!this.canManageTeam) {
      this.error = 'You do not have permission to update stats.';
      return;
    }

    if (this.statForm.invalid) {
      this.statForm.markAllAsTouched();
      return;
    }

    const raw = this.statForm.getRawValue();

    this.statsSavingMemberId = memberId;
    this.error = '';

    this.teamApi
      .upsertMemberStats(memberId, {
        season: raw.season ?? '',
        gamesPlayed: Number(raw.gamesPlayed ?? 0),
        goals: Number(raw.goals ?? 0),
        assists: Number(raw.assists ?? 0),
        penaltyMins: Number(raw.penaltyMins ?? 0),
      })
      .subscribe({
        next: () => {
          this.statsSavingMemberId = null;
          this.cancelStatEditor();
          this.loadMyStats();
          this.reload();
        },
        error: () => {
          this.statsSavingMemberId = null;
          this.error = 'Could not save player stats.';
          this.cdr.detectChanges();
        },
      });
  }

  statEditorPlayerName(): string {
    if (!this.statEditorMemberId) return 'Player';

    const player =
      this.regulars.find((p) => p.id === this.statEditorMemberId) ??
      this.spares.find((p) => p.id === this.statEditorMemberId);

    return player?.displayName ?? 'Player';
  }

  clearStatsFilters() {
    this.statsFilterForm.reset({
      season: '',
      team: '',
    });
  }

  canAssignCaptains(): boolean {
    return this.myRole === 'GENERAL_MANAGER';
  }

  makeCaptain(member: TeamMember): void {
    if (!this.canAssignCaptains() || this.savingRoleMemberId()) {
      return;
    }

    this.savingRoleMemberId.set(member.id);
    this.roleError.set(null);

    this.teamApi.updateMemberRole(member.id, 'CAPTAIN').subscribe({
      next: () => {
        this.savingRoleMemberId.set(null);
        this.reload();
      },
      error: (err) => {
        this.roleError.set(err?.error?.message || 'Could not assign Captain.');
        this.savingRoleMemberId.set(null);
        this.cdr.detectChanges();
      },
    });
  }

  removeCaptain(member: TeamMember): void {
    if (!this.canAssignCaptains() || this.savingRoleMemberId()) {
      return;
    }

    this.savingRoleMemberId.set(member.id);
    this.roleError.set(null);

    this.teamApi.updateMemberRole(member.id, 'PLAYER').subscribe({
      next: () => {
        this.savingRoleMemberId.set(null);
        this.reload();
      },
      error: (err) => {
        this.roleError.set(
          err?.error?.message || 'Could not remove Captain role.',
        );
        this.savingRoleMemberId.set(null);
        this.cdr.detectChanges();
      },
    });
  }

  gameOpponent(game: TeamGame): string {
    return game.opponentTeam?.name ?? game.opponent ?? 'TBD';
  }

  gameArena(game: TeamGame): string {
    const arena = game.arena as
      | string
      | { name?: string | null; address?: string | null }
      | null
      | undefined;

    if (!arena) {
      return 'Arena TBD';
    }

    if (typeof arena === 'string') {
      return arena;
    }

    return arena.name ?? 'Arena TBD';
  }
}
