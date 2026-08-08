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
  TournamentAnnouncement,
  TournamentAuditLogEntry,
  TournamentBracket,
  TournamentBracketMatch,
  TournamentCoOrganizer,
  TournamentGame,
  TournamentGamePlayerStat,
  TournamentPaymentRow,
  TournamentPaymentsStatus,
  TournamentPlayerPosition,
  TournamentRegistration,
  TournamentSponsor,
  TournamentSponsorTier,
  TournamentTeam,
  TournamentTeamPlayer,
  TournamentVenue,
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

  showBracketBuilder = signal(false);
  bracketSeedTeamIds = signal<string[]>([]);
  creatingBracket = signal(false);
  bracketError = signal<string | null>(null);
  deletingBracketId = signal<string | null>(null);

  schedulingMatchKey = signal<string | null>(null);
  savingMatchSchedule = signal(false);
  scheduleMatchError = signal<string | null>(null);

  savingAnnouncement = signal(false);
  announcementError = signal<string | null>(null);
  deletingAnnouncementId = signal<string | null>(null);

  showVenueForm = signal(false);
  savingVenue = signal(false);
  venueError = signal<string | null>(null);
  editingVenueId = signal<string | null>(null);
  deletingVenueId = signal<string | null>(null);

  editingSponsorId = signal<string | null>(null);

  coOrganizers = signal<TournamentCoOrganizer[]>([]);
  coOrganizerUserIds = signal<string[]>([]);
  addingCoOrganizer = signal(false);
  coOrganizerError = signal<string | null>(null);
  removingCoOrganizerId = signal<string | null>(null);

  auditLog = signal<TournamentAuditLogEntry[]>([]);
  showAuditLog = signal(false);
  loadingAuditLog = signal(false);

  payments = signal<TournamentPaymentRow[]>([]);

  detailsForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    rules: [''],
    startDate: [''],
    endDate: [''],
    registrationMode: ['OPEN' as 'OPEN' | 'WAITLIST' | 'CLOSED'],
    registrationDeadline: [''],
    registrationFeeDollars: [0, [Validators.min(0)]],
    contactName: [''],
    contactEmail: ['', [Validators.email]],
    contactPhone: [''],
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
    tier: ['' as TournamentSponsorTier | ''],
  });

  announcementForm = this.fb.group({
    body: ['', Validators.required],
  });

  venueForm = this.fb.group({
    name: ['', Validators.required],
    address: [''],
    parkingInfo: [''],
    dressingRoomInfo: [''],
    concessionsInfo: [''],
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

  coOrganizerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  bracketForm = this.fb.group({
    name: ['Playoffs', Validators.required],
    division: [''],
  });

  matchScheduleForm = this.fb.group({
    startsAt: ['', Validators.required],
    arenaName: [''],
    notes: [''],
  });

  get isOwner(): boolean {
    const userId = this.authState.user()?.id;
    if (!userId) {
      return false;
    }

    if (this.tournament()?.createdById === userId) {
      return true;
    }

    return this.coOrganizerUserIds().includes(userId);
  }

  /** Only the tournament creator can invite/remove co-organizers. */
  get isPrimaryOwner(): boolean {
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
          contactName: tournament.contactName ?? '',
          contactEmail: tournament.contactEmail ?? '',
          contactPhone: tournament.contactPhone ?? '',
        });

        this.loading.set(false);

        if (this.isOwner) {
          this.loadRegistrations();
          this.loadPaymentsStatus();
          this.loadPayments();
          this.loadCoOrganizers();
        } else if (this.authState.user()?.id) {
          // Not the creator, but might be a co-organizer - probing the
          // co-organizer list is itself owner-or-co-organizer gated, so a
          // 403 here just means "not authorized," which is expected.
          this.loadCoOrganizers(true);
        }
      },
      error: () => {
        this.error.set('Could not load this tournament.');
        this.loading.set(false);
      },
    });
  }

  private loadCoOrganizers(probingAccess = false): void {
    this.tournamentsApi.listCoOrganizers(this.tournamentId).subscribe({
      next: (coOrganizers) => {
        this.coOrganizers.set(coOrganizers);
        this.coOrganizerUserIds.set(coOrganizers.map((c) => c.user.id));

        if (probingAccess && this.isOwner) {
          this.loadRegistrations();
          this.loadPaymentsStatus();
          this.loadPayments();
        }
      },
      error: () => {
        this.coOrganizers.set([]);
      },
    });
  }

  private loadPayments(): void {
    this.tournamentsApi.listPayments(this.tournamentId).subscribe({
      next: (payments) => {
        this.payments.set(payments);
      },
      error: () => {
        this.payments.set([]);
      },
    });
  }

  toggleAuditLog(): void {
    this.showAuditLog.set(!this.showAuditLog());

    if (this.showAuditLog() && this.auditLog().length === 0) {
      this.loadingAuditLog.set(true);

      this.tournamentsApi.listAuditLog(this.tournamentId).subscribe({
        next: (entries) => {
          this.auditLog.set(entries);
          this.loadingAuditLog.set(false);
        },
        error: () => {
          this.loadingAuditLog.set(false);
        },
      });
    }
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
        contactName: value.contactName.trim() || null,
        contactEmail: value.contactEmail.trim() || null,
        contactPhone: value.contactPhone.trim() || null,
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

  openEditSponsor(sponsor: TournamentSponsor): void {
    this.editingSponsorId.set(sponsor.id);
    this.sponsorError.set(null);
    this.sponsorForm.reset({
      name: sponsor.name,
      logoUrl: sponsor.logoUrl ?? '',
      linkUrl: sponsor.linkUrl ?? '',
      tier: sponsor.tier ?? '',
    });
  }

  cancelSponsorEdit(): void {
    this.editingSponsorId.set(null);
    this.sponsorError.set(null);
    this.sponsorForm.reset({ name: '', logoUrl: '', linkUrl: '', tier: '' });
  }

  addSponsor(): void {
    if (this.sponsorForm.invalid || this.savingSponsor()) {
      this.sponsorForm.markAllAsTouched();
      return;
    }

    const value = this.sponsorForm.getRawValue();
    const editingId = this.editingSponsorId();

    this.savingSponsor.set(true);
    this.sponsorError.set(null);

    const payload = {
      name: value.name.trim(),
      logoUrl: value.logoUrl.trim() || null,
      linkUrl: value.linkUrl.trim() || null,
      tier: value.tier || null,
    };

    const request = editingId
      ? this.tournamentsApi.updateSponsor(this.tournamentId, editingId, payload)
      : this.tournamentsApi.addSponsor(this.tournamentId, payload);

    request.subscribe({
      next: () => {
        this.savingSponsor.set(false);
        this.editingSponsorId.set(null);
        this.sponsorForm.reset({ name: '', logoUrl: '', linkUrl: '', tier: '' });
        this.load();
      },
      error: (err) => {
        this.sponsorError.set(
          err?.error?.message ||
            (editingId
              ? 'Could not save this sponsor.'
              : 'Could not add this sponsor.'),
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

  openBracketBuilder(): void {
    this.showBracketBuilder.set(true);
    this.bracketSeedTeamIds.set([]);
    this.bracketError.set(null);
    this.bracketForm.reset({ name: 'Playoffs', division: '' });
  }

  cancelBracketBuilder(): void {
    this.showBracketBuilder.set(false);
    this.bracketSeedTeamIds.set([]);
    this.bracketError.set(null);
  }

  isSeeded(teamId: string): boolean {
    return this.bracketSeedTeamIds().includes(teamId);
  }

  toggleSeedTeam(teamId: string): void {
    this.bracketSeedTeamIds.update((ids) =>
      ids.includes(teamId)
        ? ids.filter((id) => id !== teamId)
        : [...ids, teamId],
    );
  }

  moveSeedTeam(index: number, direction: -1 | 1): void {
    this.bracketSeedTeamIds.update((ids) => {
      const target = index + direction;

      if (target < 0 || target >= ids.length) {
        return ids;
      }

      const next = [...ids];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  teamNameById(teamId: string): string {
    return (
      this.tournament()?.teams.find((team) => team.id === teamId)?.name ??
      'Unknown team'
    );
  }

  createBracket(): void {
    if (this.bracketForm.invalid || this.creatingBracket()) {
      this.bracketForm.markAllAsTouched();
      return;
    }

    const seedTeamIds = this.bracketSeedTeamIds();

    if (seedTeamIds.length < 2) {
      this.bracketError.set('Select at least 2 teams to seed a bracket.');
      return;
    }

    const value = this.bracketForm.getRawValue();

    this.creatingBracket.set(true);
    this.bracketError.set(null);

    this.tournamentsApi
      .createBracket(this.tournamentId, {
        name: value.name.trim(),
        division: value.division.trim() || null,
        teamIds: seedTeamIds,
      })
      .subscribe({
        next: () => {
          this.creatingBracket.set(false);
          this.showBracketBuilder.set(false);
          this.bracketSeedTeamIds.set([]);
          this.load();
        },
        error: (err) => {
          this.bracketError.set(
            err?.error?.message || 'Could not create this bracket.',
          );
          this.creatingBracket.set(false);
        },
      });
  }

  deleteBracket(bracketId: string): void {
    this.deletingBracketId.set(bracketId);
    this.bracketError.set(null);

    this.tournamentsApi.deleteBracket(this.tournamentId, bracketId).subscribe({
      next: () => {
        this.deletingBracketId.set(null);
        this.load();
      },
      error: (err) => {
        this.bracketError.set(
          err?.error?.message || 'Could not remove this bracket.',
        );
        this.deletingBracketId.set(null);
      },
    });
  }

  matchesByRound(bracket: TournamentBracket): TournamentBracketMatch[][] {
    const rounds = new Map<number, TournamentBracketMatch[]>();

    for (const match of bracket.matches) {
      const roundMatches = rounds.get(match.round) ?? [];
      roundMatches.push(match);
      rounds.set(match.round, roundMatches);
    }

    return Array.from(rounds.keys())
      .sort((a, b) => a - b)
      .map((round) =>
        (rounds.get(round) ?? []).sort((a, b) => a.position - b.position),
      );
  }

  roundLabel(roundIndex: number, totalRounds: number): string {
    const remaining = totalRounds - roundIndex;

    if (remaining === 1) return 'Final';
    if (remaining === 2) return 'Semifinals';
    if (remaining === 3) return 'Quarterfinals';
    return `Round ${roundIndex + 1}`;
  }

  canScheduleMatch(match: TournamentBracketMatch): boolean {
    return !!match.team1Id && !!match.team2Id && !match.gameId && !match.isBye;
  }

  openScheduleMatch(match: TournamentBracketMatch): void {
    this.schedulingMatchKey.set(`${match.bracketId}:${match.id}`);
    this.scheduleMatchError.set(null);
    this.matchScheduleForm.reset({ startsAt: '', arenaName: '', notes: '' });
  }

  cancelScheduleMatch(): void {
    this.schedulingMatchKey.set(null);
    this.scheduleMatchError.set(null);
  }

  isSchedulingMatch(match: TournamentBracketMatch): boolean {
    return this.schedulingMatchKey() === `${match.bracketId}:${match.id}`;
  }

  saveMatchSchedule(match: TournamentBracketMatch): void {
    if (this.matchScheduleForm.invalid || this.savingMatchSchedule()) {
      this.matchScheduleForm.markAllAsTouched();
      return;
    }

    const value = this.matchScheduleForm.getRawValue();

    this.savingMatchSchedule.set(true);
    this.scheduleMatchError.set(null);

    this.tournamentsApi
      .scheduleMatchGame(this.tournamentId, match.bracketId, match.id, {
        startsAt: new Date(value.startsAt).toISOString(),
        arenaName: value.arenaName.trim() || null,
        notes: value.notes.trim() || null,
      })
      .subscribe({
        next: () => {
          this.savingMatchSchedule.set(false);
          this.schedulingMatchKey.set(null);
          this.load();
        },
        error: (err) => {
          this.scheduleMatchError.set(
            err?.error?.message || 'Could not schedule this match.',
          );
          this.savingMatchSchedule.set(false);
        },
      });
  }

  trackByBracketId(_index: number, bracket: TournamentBracket): string {
    return bracket.id;
  }

  trackByMatchId(_index: number, match: TournamentBracketMatch): string {
    return match.id;
  }

  addAnnouncement(): void {
    if (this.announcementForm.invalid || this.savingAnnouncement()) {
      this.announcementForm.markAllAsTouched();
      return;
    }

    const value = this.announcementForm.getRawValue();

    this.savingAnnouncement.set(true);
    this.announcementError.set(null);

    this.tournamentsApi
      .addAnnouncement(this.tournamentId, { body: value.body.trim() })
      .subscribe({
        next: () => {
          this.savingAnnouncement.set(false);
          this.announcementForm.reset({ body: '' });
          this.load();
        },
        error: (err) => {
          this.announcementError.set(
            err?.error?.message || 'Could not post this announcement.',
          );
          this.savingAnnouncement.set(false);
        },
      });
  }

  deleteAnnouncement(announcementId: string): void {
    this.deletingAnnouncementId.set(announcementId);
    this.announcementError.set(null);

    this.tournamentsApi
      .deleteAnnouncement(this.tournamentId, announcementId)
      .subscribe({
        next: () => {
          this.deletingAnnouncementId.set(null);
          this.load();
        },
        error: () => {
          this.announcementError.set('Could not remove this announcement.');
          this.deletingAnnouncementId.set(null);
        },
      });
  }

  trackByAnnouncementId(
    _index: number,
    announcement: TournamentAnnouncement,
  ): string {
    return announcement.id;
  }

  openAddVenue(): void {
    this.showVenueForm.set(true);
    this.editingVenueId.set(null);
    this.venueError.set(null);
    this.venueForm.reset({
      name: '',
      address: '',
      parkingInfo: '',
      dressingRoomInfo: '',
      concessionsInfo: '',
    });
  }

  openEditVenue(venue: TournamentVenue): void {
    this.showVenueForm.set(true);
    this.editingVenueId.set(venue.id);
    this.venueError.set(null);
    this.venueForm.reset({
      name: venue.name,
      address: venue.address ?? '',
      parkingInfo: venue.parkingInfo ?? '',
      dressingRoomInfo: venue.dressingRoomInfo ?? '',
      concessionsInfo: venue.concessionsInfo ?? '',
    });
  }

  cancelVenueEdit(): void {
    this.showVenueForm.set(false);
    this.editingVenueId.set(null);
    this.venueError.set(null);
  }

  saveVenue(): void {
    if (this.venueForm.invalid || this.savingVenue()) {
      this.venueForm.markAllAsTouched();
      return;
    }

    const value = this.venueForm.getRawValue();
    const editingId = this.editingVenueId();

    const payload = {
      name: value.name.trim(),
      address: value.address.trim() || null,
      parkingInfo: value.parkingInfo.trim() || null,
      dressingRoomInfo: value.dressingRoomInfo.trim() || null,
      concessionsInfo: value.concessionsInfo.trim() || null,
    };

    this.savingVenue.set(true);
    this.venueError.set(null);

    const request = editingId
      ? this.tournamentsApi.updateVenue(this.tournamentId, editingId, payload)
      : this.tournamentsApi.addVenue(this.tournamentId, payload);

    request.subscribe({
      next: () => {
        this.savingVenue.set(false);
        this.editingVenueId.set(null);
        this.showVenueForm.set(false);
        this.load();
      },
      error: (err) => {
        this.venueError.set(
          err?.error?.message || 'Could not save this venue.',
        );
        this.savingVenue.set(false);
      },
    });
  }

  deleteVenue(venueId: string): void {
    this.deletingVenueId.set(venueId);
    this.venueError.set(null);

    this.tournamentsApi.deleteVenue(this.tournamentId, venueId).subscribe({
      next: () => {
        this.deletingVenueId.set(null);
        this.load();
      },
      error: () => {
        this.venueError.set('Could not remove this venue.');
        this.deletingVenueId.set(null);
      },
    });
  }

  trackByVenueId(_index: number, venue: TournamentVenue): string {
    return venue.id;
  }

  addCoOrganizer(): void {
    if (this.coOrganizerForm.invalid || this.addingCoOrganizer()) {
      this.coOrganizerForm.markAllAsTouched();
      return;
    }

    const value = this.coOrganizerForm.getRawValue();

    this.addingCoOrganizer.set(true);
    this.coOrganizerError.set(null);

    this.tournamentsApi
      .addCoOrganizer(this.tournamentId, { email: value.email.trim() })
      .subscribe({
        next: () => {
          this.addingCoOrganizer.set(false);
          this.coOrganizerForm.reset({ email: '' });
          this.loadCoOrganizers();
        },
        error: (err) => {
          this.coOrganizerError.set(
            err?.error?.message || 'Could not add this co-organizer.',
          );
          this.addingCoOrganizer.set(false);
        },
      });
  }

  removeCoOrganizer(coOrganizerId: string): void {
    this.removingCoOrganizerId.set(coOrganizerId);
    this.coOrganizerError.set(null);

    this.tournamentsApi
      .removeCoOrganizer(this.tournamentId, coOrganizerId)
      .subscribe({
        next: () => {
          this.removingCoOrganizerId.set(null);
          this.loadCoOrganizers();
        },
        error: (err) => {
          this.coOrganizerError.set(
            err?.error?.message || 'Could not remove this co-organizer.',
          );
          this.removingCoOrganizerId.set(null);
        },
      });
  }

  trackByCoOrganizerId(_index: number, coOrganizer: TournamentCoOrganizer): string {
    return coOrganizer.id;
  }

  trackByAuditLogId(_index: number, entry: TournamentAuditLogEntry): string {
    return entry.id;
  }

  private csvEscape(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }

    return value;
  }

  private downloadCsv(filename: string, header: string[], rows: string[][]): void {
    const lines = [
      header.join(','),
      ...rows.map((row) => row.map((v) => this.csvEscape(v)).join(',')),
    ];

    const blob = new Blob([lines.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  exportRegistrationsCsv(): void {
    const header = [
      'Team Name',
      'Division',
      'Contact Name',
      'Contact Email',
      'Contact Phone',
      'Status',
      'Paid',
      'Submitted',
    ];

    const rows = this.registrations().map((r) => [
      r.teamName,
      r.division ?? '',
      r.contactName,
      r.contactEmail,
      r.contactPhone ?? '',
      r.status,
      r.paid ? 'Yes' : 'No',
      r.createdAt,
    ]);

    this.downloadCsv(`registrations-${this.tournamentId}.csv`, header, rows);
  }

  exportTeamsCsv(): void {
    const header = ['Team Name', 'Division', 'Coach', 'Player Count'];

    const rows = (this.tournament()?.teams ?? []).map((t) => [
      t.name,
      t.division ?? '',
      t.coachName ?? '',
      String(t.players.length),
    ]);

    this.downloadCsv(`teams-${this.tournamentId}.csv`, header, rows);
  }

  exportPaymentsCsv(): void {
    const header = [
      'Team Name',
      'Contact Email',
      'Amount',
      'Currency',
      'Status',
      'Date',
    ];

    const rows = this.payments().map((p) => [
      p.registration.teamName,
      p.registration.contactEmail,
      (p.amountCents / 100).toFixed(2),
      p.currency.toUpperCase(),
      p.status,
      p.createdAt,
    ]);

    this.downloadCsv(`payments-${this.tournamentId}.csv`, header, rows);
  }
}
