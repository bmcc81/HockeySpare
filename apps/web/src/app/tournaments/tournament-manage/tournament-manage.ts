import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  Tournament,
  TournamentGame,
  TournamentGamePlayerStat,
  TournamentPaymentsStatus,
  TournamentPlayerPosition,
  TournamentRegistration,
  TournamentSponsor,
  TournamentTeam,
  TournamentTeamPlayer,
} from '@hockeyspare/contracts';
import { TournamentsApiService } from '../../core/services/tournaments-api.service';
import { AuthStateService } from '../../auth/auth-state.service';

@Component({
  selector: 'app-tournament-manage',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './tournament-manage.html',
})
export class TournamentManageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly tournamentsApi = inject(TournamentsApiService);
  private readonly authState = inject(AuthStateService);

  tournamentId = this.route.snapshot.paramMap.get('id') ?? '';

  tournament = signal<Tournament | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  savingDetails = signal(false);
  detailsSuccess = signal<string | null>(null);

  savingGame = signal(false);
  gameError = signal<string | null>(null);
  editingGameId = signal<string | null>(null);
  deletingGameId = signal<string | null>(null);

  registrations = signal<TournamentRegistration[]>([]);
  deletingRegistrationId = signal<string | null>(null);

  savingSponsor = signal(false);
  sponsorError = signal<string | null>(null);
  deletingSponsorId = signal<string | null>(null);

  scoreEditorGameId = signal<string | null>(null);
  savingScore = signal(false);
  scoreError = signal<string | null>(null);

  savingTeam = signal(false);
  teamError = signal<string | null>(null);
  editingTeamId = signal<string | null>(null);
  deletingTeamId = signal<string | null>(null);

  rosterTeamId = signal<string | null>(null);
  savingPlayer = signal(false);
  playerError = signal<string | null>(null);
  deletingPlayerId = signal<string | null>(null);

  creatingTeamFromRegistrationId = signal<string | null>(null);

  statEditorGameId = signal<string | null>(null);
  statDrafts = signal<
    Record<
      string,
      { goals: number; assists: number; penaltyMins: number; plusMinus: number }
    >
  >({});
  savingStatPlayerId = signal<string | null>(null);
  statError = signal<string | null>(null);

  paymentsStatus = signal<TournamentPaymentsStatus | null>(null);
  paymentsStatusLoading = signal(false);
  connectingStripe = signal(false);
  paymentSuccessMessage = signal<string | null>(null);
  paymentError = signal<string | null>(null);

  detailsForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    rules: [''],
    startDate: [''],
    endDate: [''],
    registrationMode: ['OPEN' as 'OPEN' | 'WAITLIST' | 'CLOSED'],
    registrationDeadline: [''],
    registrationFeeDollars: [0, [Validators.min(0)]],
  });

  gameForm = this.fb.group({
    homeTeamId: [''],
    awayTeamId: [''],
    homeTeamName: ['', Validators.required],
    awayTeamName: ['', Validators.required],
    startsAt: ['', Validators.required],
    arenaName: [''],
    notes: [''],
  });

  sponsorForm = this.fb.group({
    name: ['', Validators.required],
    logoUrl: [''],
    linkUrl: [''],
  });

  scoreForm = this.fb.group({
    homeScore: [0, [Validators.required, Validators.min(0)]],
    awayScore: [0, [Validators.required, Validators.min(0)]],
    status: ['LIVE' as 'SCHEDULED' | 'LIVE' | 'FINAL', Validators.required],
  });

  teamForm = this.fb.group({
    name: ['', Validators.required],
    division: [''],
    logoUrl: [''],
    coachName: [''],
  });

  playerForm = this.fb.group({
    displayName: ['', Validators.required],
    position: ['' as TournamentPlayerPosition | ''],
    jerseyNumber: [''],
  });

  get isOwner(): boolean {
    const userId = this.authState.user()?.id;
    return !!userId && this.tournament()?.createdById === userId;
  }

  get publicUrl(): string {
    return `${window.location.origin}/tournaments/${this.tournamentId}`;
  }

  ngOnInit(): void {
    this.load();

    const params = this.route.snapshot.queryParamMap;

    if (params.get('stripeReturn') === '1') {
      this.handleStripeReturn();
    }

    this.gameForm.controls.homeTeamId.valueChanges.subscribe((teamId) => {
      this.syncGameTeamName('home', teamId);
    });

    this.gameForm.controls.awayTeamId.valueChanges.subscribe((teamId) => {
      this.syncGameTeamName('away', teamId);
    });
  }

  private syncGameTeamName(side: 'home' | 'away', teamId: string): void {
    if (!teamId) {
      return;
    }

    const team = this.tournament()?.teams.find((t) => t.id === teamId);

    if (!team) {
      return;
    }

    this.gameForm.patchValue(
      side === 'home' ? { homeTeamName: team.name } : { awayTeamName: team.name },
    );
  }

  private toDateInputValue(value?: string | null): string {
    if (!value) {
      return '';
    }

    return value.slice(0, 10);
  }

  private toDateTimeInputValue(value?: string | null): string {
    if (!value) {
      return '';
    }

    return value.slice(0, 16);
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.tournamentsApi.getPublic(this.tournamentId).subscribe({
      next: (tournament) => {
        this.tournament.set(tournament);

        this.detailsForm.patchValue({
          name: tournament.name,
          description: tournament.description ?? '',
          rules: tournament.rules ?? '',
          startDate: this.toDateInputValue(tournament.startDate),
          endDate: this.toDateInputValue(tournament.endDate),
          registrationMode: tournament.registrationMode,
          registrationDeadline: this.toDateTimeInputValue(
            tournament.registrationDeadline,
          ),
          registrationFeeDollars: tournament.registrationFeeCents
            ? tournament.registrationFeeCents / 100
            : 0,
        });

        this.loading.set(false);

        if (this.isOwner) {
          this.loadRegistrations();
          this.loadPaymentsStatus();
        }
      },
      error: () => {
        this.error.set('Could not load this tournament.');
        this.loading.set(false);
      },
    });
  }

  private loadRegistrations(): void {
    this.tournamentsApi.listRegistrations(this.tournamentId).subscribe({
      next: (registrations) => {
        this.registrations.set(registrations);
      },
      error: () => {
        this.registrations.set([]);
      },
    });
  }

  private loadPaymentsStatus(): void {
    this.paymentsStatusLoading.set(true);

    this.tournamentsApi.getPaymentsStatus(this.tournamentId).subscribe({
      next: (status) => {
        this.paymentsStatus.set(status);
        this.paymentsStatusLoading.set(false);
      },
      error: () => {
        this.paymentsStatus.set(null);
        this.paymentsStatusLoading.set(false);
      },
    });
  }

  private handleStripeReturn(): void {
    this.tournamentsApi.refreshStripeStatus(this.tournamentId).subscribe({
      next: (status) => {
        this.paymentsStatus.set(status);

        this.paymentSuccessMessage.set(
          status.payoutsEnabled
            ? 'Stripe account connected. You can now collect registration payments.'
            : 'Stripe onboarding is not finished yet. Connect again to continue.',
        );
      },
      error: () => {
        this.paymentError.set('Could not confirm Stripe connection status.');
      },
    });
  }

  connectStripe(): void {
    if (this.connectingStripe()) {
      return;
    }

    this.connectingStripe.set(true);
    this.paymentError.set(null);

    this.tournamentsApi.connectStripe(this.tournamentId).subscribe({
      next: (result) => {
        window.location.href = result.url;
      },
      error: (err) => {
        this.connectingStripe.set(false);
        this.paymentError.set(
          err?.error?.message || 'Could not start Stripe onboarding.',
        );
      },
    });
  }

  savingRegistrationId = signal<string | null>(null);

  setRegistrationStatus(
    registrationId: string,
    status: 'CONFIRMED' | 'WAITLISTED',
  ): void {
    this.savingRegistrationId.set(registrationId);
    this.error.set(null);

    this.tournamentsApi
      .updateRegistration(this.tournamentId, registrationId, { status })
      .subscribe({
        next: () => {
          this.savingRegistrationId.set(null);
          this.loadRegistrations();
        },
        error: (err) => {
          this.error.set(
            err?.error?.message || 'Could not update this registration.',
          );
          this.savingRegistrationId.set(null);
        },
      });
  }

  deleteRegistration(registrationId: string): void {
    this.deletingRegistrationId.set(registrationId);
    this.error.set(null);

    this.tournamentsApi
      .deleteRegistration(this.tournamentId, registrationId)
      .subscribe({
        next: () => {
          this.deletingRegistrationId.set(null);
          this.loadRegistrations();
        },
        error: () => {
          this.error.set('Could not remove this registration.');
          this.deletingRegistrationId.set(null);
        },
      });
  }

  trackByRegistrationId(_index: number, registration: TournamentRegistration): string {
    return registration.id;
  }

  saveDetails(): void {
    if (this.detailsForm.invalid || this.savingDetails()) {
      this.detailsForm.markAllAsTouched();
      return;
    }

    const value = this.detailsForm.getRawValue();

    this.savingDetails.set(true);
    this.error.set(null);
    this.detailsSuccess.set(null);

    this.tournamentsApi
      .update(this.tournamentId, {
        name: value.name.trim(),
        description: value.description.trim() || null,
        rules: value.rules.trim() || null,
        startDate: value.startDate || null,
        endDate: value.endDate || null,
        registrationMode: value.registrationMode,
        registrationDeadline: value.registrationDeadline
          ? new Date(value.registrationDeadline).toISOString()
          : null,
        registrationFeeCents: value.registrationFeeDollars
          ? Math.round(Number(value.registrationFeeDollars) * 100)
          : null,
      })
      .subscribe({
        next: (tournament) => {
          this.tournament.set(tournament);
          this.savingDetails.set(false);
          this.detailsSuccess.set('Saved.');
        },
        error: (err) => {
          this.error.set(
            err?.error?.message || 'Could not save tournament details.',
          );
          this.savingDetails.set(false);
        },
      });
  }

  openAddGame(): void {
    this.editingGameId.set(null);
    this.gameError.set(null);

    this.gameForm.reset({
      homeTeamId: '',
      awayTeamId: '',
      homeTeamName: '',
      awayTeamName: '',
      startsAt: '',
      arenaName: '',
      notes: '',
    });
  }

  openEditGame(game: TournamentGame): void {
    this.editingGameId.set(game.id);
    this.gameError.set(null);

    this.gameForm.reset({
      homeTeamId: game.homeTeamId ?? '',
      awayTeamId: game.awayTeamId ?? '',
      homeTeamName: game.homeTeamName,
      awayTeamName: game.awayTeamName,
      startsAt: game.startsAt.slice(0, 16),
      arenaName: game.arenaName ?? '',
      notes: game.notes ?? '',
    });
  }

  cancelGameEdit(): void {
    this.editingGameId.set(null);
    this.gameError.set(null);
  }

  saveGame(): void {
    if (this.gameForm.invalid || this.savingGame()) {
      this.gameForm.markAllAsTouched();
      return;
    }

    const value = this.gameForm.getRawValue();
    const payload = {
      homeTeamName: value.homeTeamName.trim(),
      awayTeamName: value.awayTeamName.trim(),
      homeTeamId: value.homeTeamId || null,
      awayTeamId: value.awayTeamId || null,
      startsAt: new Date(value.startsAt).toISOString(),
      arenaName: value.arenaName.trim() || null,
      notes: value.notes.trim() || null,
    };

    this.savingGame.set(true);
    this.gameError.set(null);

    const editingId = this.editingGameId();

    const request = editingId
      ? this.tournamentsApi.updateGame(this.tournamentId, editingId, payload)
      : this.tournamentsApi.addGame(this.tournamentId, payload);

    request.subscribe({
      next: () => {
        this.savingGame.set(false);
        this.editingGameId.set(null);
        this.load();
      },
      error: (err) => {
        this.gameError.set(
          err?.error?.message || 'Could not save this game.',
        );
        this.savingGame.set(false);
      },
    });
  }

  deleteGame(gameId: string): void {
    this.deletingGameId.set(gameId);
    this.error.set(null);

    this.tournamentsApi.deleteGame(this.tournamentId, gameId).subscribe({
      next: () => {
        this.deletingGameId.set(null);
        this.load();
      },
      error: () => {
        this.error.set('Could not delete this game.');
        this.deletingGameId.set(null);
      },
    });
  }

  trackByGameId(_index: number, game: TournamentGame): string {
    return game.id;
  }

  openScoreEditor(game: TournamentGame): void {
    this.scoreEditorGameId.set(game.id);
    this.scoreError.set(null);

    this.scoreForm.reset({
      homeScore: game.homeScore ?? 0,
      awayScore: game.awayScore ?? 0,
      status: game.status === 'SCHEDULED' ? 'LIVE' : game.status,
    });
  }

  cancelScoreEdit(): void {
    this.scoreEditorGameId.set(null);
    this.scoreError.set(null);
  }

  saveScore(gameId: string): void {
    if (this.scoreForm.invalid || this.savingScore()) {
      this.scoreForm.markAllAsTouched();
      return;
    }

    const value = this.scoreForm.getRawValue();

    this.savingScore.set(true);
    this.scoreError.set(null);

    this.tournamentsApi
      .updateGameScore(this.tournamentId, gameId, {
        homeScore: Number(value.homeScore),
        awayScore: Number(value.awayScore),
        status: value.status,
      })
      .subscribe({
        next: () => {
          this.savingScore.set(false);
          this.scoreEditorGameId.set(null);
          this.load();
        },
        error: (err) => {
          this.scoreError.set(
            err?.error?.message || 'Could not update the score.',
          );
          this.savingScore.set(false);
        },
      });
  }

  addSponsor(): void {
    if (this.sponsorForm.invalid || this.savingSponsor()) {
      this.sponsorForm.markAllAsTouched();
      return;
    }

    const value = this.sponsorForm.getRawValue();

    this.savingSponsor.set(true);
    this.sponsorError.set(null);

    this.tournamentsApi
      .addSponsor(this.tournamentId, {
        name: value.name.trim(),
        logoUrl: value.logoUrl.trim() || null,
        linkUrl: value.linkUrl.trim() || null,
      })
      .subscribe({
        next: () => {
          this.savingSponsor.set(false);
          this.sponsorForm.reset({ name: '', logoUrl: '', linkUrl: '' });
          this.load();
        },
        error: (err) => {
          this.sponsorError.set(
            err?.error?.message || 'Could not add this sponsor.',
          );
          this.savingSponsor.set(false);
        },
      });
  }

  deleteSponsor(sponsorId: string): void {
    this.deletingSponsorId.set(sponsorId);
    this.error.set(null);

    this.tournamentsApi.deleteSponsor(this.tournamentId, sponsorId).subscribe({
      next: () => {
        this.deletingSponsorId.set(null);
        this.load();
      },
      error: () => {
        this.error.set('Could not remove this sponsor.');
        this.deletingSponsorId.set(null);
      },
    });
  }

  trackBySponsorId(_index: number, sponsor: TournamentSponsor): string {
    return sponsor.id;
  }

  openAddTeam(): void {
    this.editingTeamId.set(null);
    this.teamError.set(null);
    this.teamForm.reset({ name: '', division: '', logoUrl: '', coachName: '' });
  }

  openEditTeam(team: TournamentTeam): void {
    this.editingTeamId.set(team.id);
    this.teamError.set(null);
    this.teamForm.reset({
      name: team.name,
      division: team.division ?? '',
      logoUrl: team.logoUrl ?? '',
      coachName: team.coachName ?? '',
    });
  }

  cancelTeamEdit(): void {
    this.editingTeamId.set(null);
    this.teamError.set(null);
  }

  saveTeam(): void {
    if (this.teamForm.invalid || this.savingTeam()) {
      this.teamForm.markAllAsTouched();
      return;
    }

    const value = this.teamForm.getRawValue();
    const editingId = this.editingTeamId();

    this.savingTeam.set(true);
    this.teamError.set(null);

    const request = editingId
      ? this.tournamentsApi.updateTeam(this.tournamentId, editingId, {
          name: value.name.trim(),
          division: value.division.trim() || null,
          logoUrl: value.logoUrl.trim() || null,
          coachName: value.coachName.trim() || null,
        })
      : this.tournamentsApi.addTeam(this.tournamentId, {
          name: value.name.trim(),
          division: value.division.trim() || null,
          logoUrl: value.logoUrl.trim() || null,
          coachName: value.coachName.trim() || null,
        });

    request.subscribe({
      next: () => {
        this.savingTeam.set(false);
        this.editingTeamId.set(null);
        this.load();
      },
      error: (err) => {
        this.teamError.set(err?.error?.message || 'Could not save this team.');
        this.savingTeam.set(false);
      },
    });
  }

  deleteTeam(teamId: string): void {
    this.deletingTeamId.set(teamId);
    this.teamError.set(null);

    this.tournamentsApi.deleteTeam(this.tournamentId, teamId).subscribe({
      next: () => {
        this.deletingTeamId.set(null);
        this.load();
      },
      error: (err) => {
        this.teamError.set(
          err?.error?.message || 'Could not remove this team.',
        );
        this.deletingTeamId.set(null);
      },
    });
  }

  createTeamFromRegistration(registrationId: string): void {
    this.creatingTeamFromRegistrationId.set(registrationId);
    this.error.set(null);

    this.tournamentsApi
      .createTeamFromRegistration(this.tournamentId, registrationId)
      .subscribe({
        next: () => {
          this.creatingTeamFromRegistrationId.set(null);
          this.load();
        },
        error: (err) => {
          this.error.set(
            err?.error?.message || 'Could not create a team from this registration.',
          );
          this.creatingTeamFromRegistrationId.set(null);
        },
      });
  }

  registrationHasTeam(registrationId: string): boolean {
    return (
      this.tournament()?.teams.some(
        (team) => team.registrationId === registrationId,
      ) ?? false
    );
  }

  trackByTeamId(_index: number, team: TournamentTeam): string {
    return team.id;
  }

  openRoster(teamId: string): void {
    this.rosterTeamId.set(this.rosterTeamId() === teamId ? null : teamId);
    this.playerError.set(null);
    this.playerForm.reset({ displayName: '', position: '', jerseyNumber: '' });
  }

  addTeamPlayer(teamId: string): void {
    if (this.playerForm.invalid || this.savingPlayer()) {
      this.playerForm.markAllAsTouched();
      return;
    }

    const value = this.playerForm.getRawValue();

    this.savingPlayer.set(true);
    this.playerError.set(null);

    this.tournamentsApi
      .addTeamPlayer(this.tournamentId, teamId, {
        displayName: value.displayName.trim(),
        position: value.position || null,
        jerseyNumber: value.jerseyNumber ? Number(value.jerseyNumber) : null,
      })
      .subscribe({
        next: () => {
          this.savingPlayer.set(false);
          this.playerForm.reset({
            displayName: '',
            position: '',
            jerseyNumber: '',
          });
          this.load();
        },
        error: (err: any) => {
          this.playerError.set(
            err?.error?.message || 'Could not add this player.',
          );
          this.savingPlayer.set(false);
        },
      });
  }

  removeTeamPlayer(teamId: string, playerId: string): void {
    this.deletingPlayerId.set(playerId);
    this.playerError.set(null);

    this.tournamentsApi
      .removeTeamPlayer(this.tournamentId, teamId, playerId)
      .subscribe({
        next: () => {
          this.deletingPlayerId.set(null);
          this.load();
        },
        error: (err) => {
          this.playerError.set(
            err?.error?.message || 'Could not remove this player.',
          );
          this.deletingPlayerId.set(null);
        },
      });
  }

  trackByPlayerId(_index: number, player: TournamentTeamPlayer): string {
    return player.id;
  }

  gameRosterPlayers(game: TournamentGame): TournamentTeamPlayer[] {
    const teams = this.tournament()?.teams ?? [];
    const homeTeam = teams.find((t) => t.id === game.homeTeamId);
    const awayTeam = teams.find((t) => t.id === game.awayTeamId);

    return [...(homeTeam?.players ?? []), ...(awayTeam?.players ?? [])];
  }

  openStatEditor(game: TournamentGame): void {
    if (this.statEditorGameId() === game.id) {
      this.statEditorGameId.set(null);
      return;
    }

    this.statEditorGameId.set(game.id);
    this.statError.set(null);

    const drafts: Record<
      string,
      { goals: number; assists: number; penaltyMins: number; plusMinus: number }
    > = {};

    for (const player of this.gameRosterPlayers(game)) {
      const existing = game.playerStats?.find(
        (stat) => stat.teamPlayerId === player.id,
      );

      drafts[player.id] = {
        goals: existing?.goals ?? 0,
        assists: existing?.assists ?? 0,
        penaltyMins: existing?.penaltyMins ?? 0,
        plusMinus: existing?.plusMinus ?? 0,
      };
    }

    this.statDrafts.set(drafts);
  }

  updateStatDraft(
    playerId: string,
    field: 'goals' | 'assists' | 'penaltyMins' | 'plusMinus',
    event: Event,
  ): void {
    const input = event.target as HTMLInputElement;
    const value = Number(input.value) || 0;

    this.statDrafts.update((drafts) => ({
      ...drafts,
      [playerId]: {
        ...drafts[playerId],
        [field]: value,
      },
    }));
  }

  saveGamePlayerStat(gameId: string, playerId: string): void {
    const draft = this.statDrafts()[playerId];

    if (!draft) {
      return;
    }

    this.savingStatPlayerId.set(playerId);
    this.statError.set(null);

    this.tournamentsApi
      .upsertGamePlayerStat(this.tournamentId, gameId, {
        teamPlayerId: playerId,
        goals: draft.goals,
        assists: draft.assists,
        penaltyMins: draft.penaltyMins,
        plusMinus: draft.plusMinus,
      })
      .subscribe({
        next: () => {
          this.savingStatPlayerId.set(null);
          this.load();
        },
        error: (err) => {
          this.statError.set(
            err?.error?.message || 'Could not save this stat line.',
          );
          this.savingStatPlayerId.set(null);
        },
      });
  }
}
