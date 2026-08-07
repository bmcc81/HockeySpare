import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  Tournament,
  TournamentBracket,
  TournamentBracketMatch,
  TournamentGame,
  TournamentPlayerLeaderRow,
  TournamentStandingRow,
  TournamentTeam,
} from '@hockeyspare/contracts';
import { Subscription, interval, switchMap } from 'rxjs';
import { TournamentsApiService } from '../../core/services/tournaments-api.service';

type TournamentTab =
  | 'schedule'
  | 'standings'
  | 'teams'
  | 'bracket'
  | 'leaders'
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
  divisionFilter = signal<string>('');

  leaders = signal<TournamentPlayerLeaderRow[]>([]);
  leadersLoading = signal(false);

  expandedTeamId = signal<string | null>(null);

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
    this.loadLeaders();

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
          this.loadLeaders();
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

    this.tournamentsApi
      .getStandings(this.tournamentId, this.divisionFilter() || null)
      .subscribe({
        next: (standings) => {
          this.standings.set(standings);
          this.standingsLoading.set(false);
        },
        error: () => {
          this.standingsLoading.set(false);
        },
      });
  }

  private loadLeaders(): void {
    this.leadersLoading.set(true);

    this.tournamentsApi.getPlayerLeaders(this.tournamentId).subscribe({
      next: (leaders) => {
        this.leaders.set(leaders);
        this.leadersLoading.set(false);
      },
      error: () => {
        this.leadersLoading.set(false);
      },
    });
  }

  availableDivisions(): string[] {
    const teams = this.tournament()?.teams ?? [];
    const divisions = new Set(
      teams.map((team) => team.division).filter((d): d is string => !!d),
    );

    return Array.from(divisions).sort();
  }

  setDivisionFilter(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.divisionFilter.set(select.value);
    this.loadStandings();
  }

  filteredGames(): TournamentGame[] {
    const division = this.divisionFilter();
    const games = this.tournament()?.games ?? [];

    if (!division) {
      return games;
    }

    const teams = this.tournament()?.teams ?? [];
    const divisionTeamIds = new Set(
      teams.filter((t) => t.division === division).map((t) => t.id),
    );

    return games.filter(
      (game) =>
        (game.homeTeamId && divisionTeamIds.has(game.homeTeamId)) ||
        (game.awayTeamId && divisionTeamIds.has(game.awayTeamId)),
    );
  }

  toggleTeamExpanded(teamId: string): void {
    this.expandedTeamId.set(this.expandedTeamId() === teamId ? null : teamId);
  }

  teamGames(teamId: string): TournamentGame[] {
    return (this.tournament()?.games ?? []).filter(
      (game) => game.homeTeamId === teamId || game.awayTeamId === teamId,
    );
  }

  teamRecord(teamId: string): { wins: number; losses: number; ties: number } {
    let wins = 0;
    let losses = 0;
    let ties = 0;

    for (const game of this.teamGames(teamId)) {
      if (
        game.status !== 'FINAL' ||
        game.homeScore == null ||
        game.awayScore == null
      ) {
        continue;
      }

      const isHome = game.homeTeamId === teamId;
      const goalsFor = isHome ? game.homeScore : game.awayScore;
      const goalsAgainst = isHome ? game.awayScore : game.homeScore;

      if (goalsFor > goalsAgainst) {
        wins += 1;
      } else if (goalsFor < goalsAgainst) {
        losses += 1;
      } else {
        ties += 1;
      }
    }

    return { wins, losses, ties };
  }

  teamLeaders(teamName: string): TournamentPlayerLeaderRow[] {
    return this.leaders().filter((leader) => leader.teamName === teamName);
  }

  trackByTeamId(_index: number, team: TournamentTeam): string {
    return team.id;
  }

  trackByGameId(_index: number, game: TournamentGame): string {
    return game.id;
  }

  trackByLeaderId(_index: number, leader: TournamentPlayerLeaderRow): string {
    return leader.teamPlayerId;
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

  trackByBracketId(_index: number, bracket: TournamentBracket): string {
    return bracket.id;
  }

  trackByMatchId(_index: number, match: TournamentBracketMatch): string {
    return match.id;
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
