import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Tournament, TournamentStandingRow } from '@hockeyspare/contracts';
import { Subscription, interval, switchMap } from 'rxjs';
import { TournamentsApiService } from '../../core/services/tournaments-api.service';

type TournamentTab =
  | 'schedule'
  | 'standings'
  | 'rules'
  | 'sponsors'
  | 'register';

const LIVE_SCORE_POLL_INTERVAL_MS = 20000;

@Component({
  selector: 'app-tournament-public',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tournament-public.html',
})
export class TournamentPublicComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly tournamentsApi = inject(TournamentsApiService);

  private pollSubscription: Subscription | null = null;

  tournamentId = this.route.snapshot.paramMap.get('id') ?? '';

  tournament = signal<Tournament | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  activeTab = signal<TournamentTab>('schedule');

  standings = signal<TournamentStandingRow[]>([]);
  standingsLoading = signal(false);

  submittingRegistration = signal(false);
  registrationError = signal<string | null>(null);
  registrationSuccess = signal(false);

  paymentVerifying = signal(false);
  paymentMessage = signal<string | null>(null);
  paymentMessageIsError = signal(false);

  registrationForm = this.fb.group({
    teamName: ['', Validators.required],
    division: [''],
    contactName: ['', Validators.required],
    contactEmail: ['', [Validators.required, Validators.email]],
    contactPhone: [''],
    notes: [''],
  });

  ngOnInit(): void {
    this.tournamentsApi.getPublic(this.tournamentId).subscribe({
      next: (tournament) => {
        this.tournament.set(tournament);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('This tournament could not be found.');
        this.loading.set(false);
      },
    });

    this.loadStandings();

    const paymentSessionId =
      this.route.snapshot.queryParamMap.get('paymentSessionId');

    if (paymentSessionId) {
      this.setTab('register');
      this.verifyPayment(paymentSessionId);
    }

    // Lightweight polling so anyone viewing the schedule sees live scores
    // update without a manual refresh, without needing a websocket setup.
    this.pollSubscription = interval(LIVE_SCORE_POLL_INTERVAL_MS)
      .pipe(switchMap(() => this.tournamentsApi.getPublic(this.tournamentId)))
      .subscribe({
        next: (tournament) => {
          this.tournament.set(tournament);
          this.loadStandings();
        },
      });
  }

  private verifyPayment(sessionId: string): void {
    this.paymentVerifying.set(true);

    this.tournamentsApi
      .verifyRegistrationCheckout(this.tournamentId, sessionId)
      .subscribe({
        next: (result) => {
          this.paymentVerifying.set(false);

          if (result.status === 'SUCCEEDED') {
            this.paymentMessageIsError.set(false);
            this.paymentMessage.set(
              `Payment received for ${result.registration.teamName}. You're all set.`,
            );
          } else {
            this.paymentMessageIsError.set(true);
            this.paymentMessage.set(
              'Your payment has not completed yet. It may still be processing.',
            );
          }
        },
        error: () => {
          this.paymentVerifying.set(false);
          this.paymentMessageIsError.set(true);
          this.paymentMessage.set('Could not confirm this payment.');
        },
      });
  }

  private loadStandings(): void {
    this.standingsLoading.set(true);

    this.tournamentsApi.getStandings(this.tournamentId).subscribe({
      next: (standings) => {
        this.standings.set(standings);
        this.standingsLoading.set(false);
      },
      error: () => {
        this.standingsLoading.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
  }

  setTab(tab: TournamentTab): void {
    this.activeTab.set(tab);
  }

  private deadlinePassed(): boolean {
    const deadline = this.tournament()?.registrationDeadline;
    return !!deadline && new Date() > new Date(deadline);
  }

  registrationClosed(): boolean {
    return (
      this.tournament()?.registrationMode === 'CLOSED' || this.deadlinePassed()
    );
  }

  registrationWaitlisted(): boolean {
    return (
      !this.registrationClosed() &&
      this.tournament()?.registrationMode === 'WAITLIST'
    );
  }

  registrationFeeDollars(): number | null {
    const cents = this.tournament()?.registrationFeeCents;

    if (!cents || !this.tournament()?.stripePayoutsEnabled) {
      return null;
    }

    return cents / 100;
  }

  submitRegistration(): void {
    if (this.registrationForm.invalid || this.submittingRegistration()) {
      this.registrationForm.markAllAsTouched();
      return;
    }

    const value = this.registrationForm.getRawValue();

    this.submittingRegistration.set(true);
    this.registrationError.set(null);

    this.tournamentsApi
      .submitRegistration(this.tournamentId, {
        teamName: value.teamName.trim(),
        division: value.division.trim() || null,
        contactName: value.contactName.trim(),
        contactEmail: value.contactEmail.trim(),
        contactPhone: value.contactPhone.trim() || null,
        notes: value.notes.trim() || null,
      })
      .subscribe({
        next: (result) => {
          if (result.checkoutUrl) {
            // Leaving the page for Stripe Checkout - no need to reset
            // submittingRegistration, the navigation takes over.
            window.location.href = result.checkoutUrl;
            return;
          }

          this.submittingRegistration.set(false);
          this.registrationSuccess.set(true);
          this.registrationForm.reset({
            teamName: '',
            division: '',
            contactName: '',
            contactEmail: '',
            contactPhone: '',
            notes: '',
          });
        },
        error: (err) => {
          this.registrationError.set(
            err?.error?.message || 'Could not submit your registration.',
          );
          this.submittingRegistration.set(false);
        },
      });
  }
}
