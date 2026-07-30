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
  TournamentRegistration,
  TournamentSponsor,
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

  detailsForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    rules: [''],
    startDate: [''],
    endDate: [''],
  });

  gameForm = this.fb.group({
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

  get isOwner(): boolean {
    const userId = this.authState.user()?.id;
    return !!userId && this.tournament()?.createdById === userId;
  }

  get publicUrl(): string {
    return `${window.location.origin}/tournaments/${this.tournamentId}`;
  }

  ngOnInit(): void {
    this.load();
  }

  private toDateInputValue(value?: string | null): string {
    if (!value) {
      return '';
    }

    return value.slice(0, 10);
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
        });

        this.loading.set(false);

        if (this.isOwner) {
          this.loadRegistrations();
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
}
