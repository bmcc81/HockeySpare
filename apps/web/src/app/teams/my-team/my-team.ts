import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  TeamMember,
  MyTeamResponse,
  TeamService,
  TeamGame,
  TeamGameAvailabilityStatus,
  PlayerStat,
} from '../../core/services/team';

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
  availabilitySavingGameId: string | null = null;
  availabilityComposerGameId: string | null = null;
  availabilityComposerStatus: TeamGameAvailabilityStatus | null = null;
  myStats: PlayerStat[] = [];

  statEditorMemberId: string | null = null;
  statsSavingMemberId: string | null = null;
  statsLoadingMemberId: string | null = null;
  statsSeasonHasRecord: boolean | null = null;

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

  availabilityForm = this.fb.group({
    note: ['', [Validators.maxLength(500)]],
  });

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

  gameForm = this.fb.group({
    title: ['League Game', Validators.required],
    startsAt: ['', Validators.required],
    arena: [''],
    opponent: [''],
    notes: [''],
  });

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

  loadMyStats() {
    this.teamApi.getMyStats().subscribe({
      next: (stats) => {
        this.myStats = stats ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('Could not load player stats:', err);
      },
    });
  }

  private defaultSeason(): string {
    const year = new Date().getFullYear();
    return `${year}-${year + 1}`;
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
    const player = this.regulars.find((p) => p.id === memberId);

    if (!player?.userId) {
      this.error =
        'This player is not linked to an app account, so stats cannot be managed yet.';
      return;
    }

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
      next: () => {
        this.availabilitySavingGameId = null;
        this.cancelAvailabilityComposer();
        this.reload();
      },
      error: () => {
        this.availabilitySavingGameId = null;
        this.error = 'Could not update your game status.';
        this.cdr.detectChanges();
      },
    });
  }

  reload() {
    this.loading = true;
    this.error = '';
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
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Could not load team page:', err);
        this.error = 'Could not load your team.';
        this.loading = false;
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

  createGame() {
    if (!this.canManageTeam) {
      this.error = 'You do not have permission to create games.';
      return;
    }

    if (this.gameForm.invalid) {
      this.gameForm.markAllAsTouched();
      return;
    }

    const raw = this.gameForm.getRawValue();

    this.teamApi
      .createGame({
        title: raw.title ?? 'League Game',
        startsAt: new Date(raw.startsAt ?? '').toISOString(),
        arena: raw.arena ?? '',
        opponent: raw.opponent ?? '',
        notes: raw.notes ?? '',
      })
      .subscribe({
        next: () => {
          this.gameForm.reset({
            title: 'League Game',
            startsAt: '',
            arena: '',
            opponent: '',
            notes: '',
          });
          this.reload();
        },
        error: () => {
          this.error = 'Could not create game.';
        },
      });
  }

  notifyGame(gameId: string) {
    if (!this.canManageTeam) {
      this.error = 'You do not have permission to notify the team.';
      return;
    }

    this.teamApi.notifyGame(gameId).subscribe({
      next: () => this.reload(),
      error: () => {
        this.error = 'Could not send notifications.';
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

  availabilityCount(
    game: TeamGame,
    status: TeamGameAvailabilityStatus,
  ): number {
    return game.availabilities?.filter((a) => a.status === status).length ?? 0;
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
    this.setGameAvailability(gameId, 'AVAILABLE', '');
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

  canEditStats(player: TeamMember): boolean {
    return !!player.userId;
  }
}
