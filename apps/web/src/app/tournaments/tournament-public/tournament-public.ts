import { PlayerHighlightsComponent } from '../../shared/player-highlights/player-highlights';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  Tournament,
  TournamentBracket,
  TournamentBracketMatch,
  TournamentGame,
  TournamentInfoListing,
  TournamentInfoListingCategory,
  TournamentLostFoundItem,
  TournamentMediaAsset,
  TournamentPlayerLeaderRow,
  TournamentSponsor,
  TournamentSponsorTier,
  TournamentStandingRow,
  TournamentTeam,
  TournamentVenue,
  TournamentVolunteerShift,
} from '@hockeyspare/contracts';
import { Subscription, interval, switchMap } from 'rxjs';
import { TournamentsApiService } from '../../core/services/tournaments-api.service';
import { AuctionApiService } from '../../core/services/auction-api.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { LocalDatePipe, TranslatePipe } from '../../core/i18n/t.pipe';
import { TeamCalendarLinksComponent } from '../shared/team-calendar-links/team-calendar-links';
import { googleGameLink } from '../shared/calendar-links';
import { groupVolunteerShifts } from '../shared/volunteer-groups';
import { announcementSummary, parseAnnouncement } from '../shared/announcement-view';
import { pickLanguage } from '../../core/i18n/pick-language';
import { AuthStateService } from '../../auth/auth-state.service';

type TournamentTab =
  | 'schedule'
  | 'standings'
  | 'teams'
  | 'bracket'
  | 'leaders'
  | 'rules'
  | 'info'
  | 'volunteer'
  | 'sponsors'
  | 'register';

const HIDDEN_ANNOUNCEMENTS_KEY = 'hockeyspare.hiddenAnnouncements';

/** Storage can be unavailable (private windows, blocked site data), so every access is guarded. */
function readHiddenAnnouncements(): Set<string> {
  try {
    const raw = localStorage.getItem(HIDDEN_ANNOUNCEMENTS_KEY);
    const ids: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

function saveHiddenAnnouncements(ids: Set<string>): void {
  try {
    localStorage.setItem(HIDDEN_ANNOUNCEMENTS_KEY, JSON.stringify([...ids]));
  } catch {
    // Not remembered; it still works for this visit.
  }
}

const LIVE_SCORE_POLL_INTERVAL_MS = 20000;
const COUNTDOWN_TICK_MS = 1000;
const BANNER_ROTATE_MS = 5000;

@Component({
  selector: 'app-tournament-public',
  standalone: true,
  imports: [
    PlayerHighlightsComponent,
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    LocalDatePipe,
    TeamCalendarLinksComponent,
  ],
  templateUrl: './tournament-public.html',
})
export class TournamentPublicComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly tournamentsApi = inject(TournamentsApiService);
  private readonly auctionApi = inject(AuctionApiService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly i18n = inject(I18nService);
  private readonly authState = inject(AuthStateService);

  auctionActive = signal(false);

  private pollSubscription: Subscription | null = null;
  private countdownIntervalId: ReturnType<typeof setInterval> | null = null;
  private bannerIntervalId: ReturnType<typeof setInterval> | null = null;

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

  countdownText = signal<string | null>(null);
  calendarTeamId = signal<string | null>(null);
  followMessage = signal<{ text: string; ok: boolean } | null>(null);
  searchQuery = signal('');
  bannerIndex = signal(0);
  highlightedGameId = signal<string | null>(null);

  registrationForm = this.fb.group({
    teamName: ['', Validators.required],
    division: [''],
    contactName: ['', Validators.required],
    contactEmail: ['', [Validators.required, Validators.email]],
    contactPhone: [''],
    notes: [''],
  });

  signingUpShiftId = signal<string | null>(null);
  submittingVolunteerSignup = signal(false);
  volunteerSignupError = signal<string | null>(null);
  volunteerSignupSuccessShiftId = signal<string | null>(null);
  /** True when the last sign-up also got a confirmation email. */
  volunteerConfirmationEmailed = signal(false);

  /**
   * Set when sign-up is still closed to the public and the signed-in viewer is
   * an organizer: the shifts they are previewing. Null for everyone else.
   */
  volunteerPreviewShifts = signal<TournamentVolunteerShift[] | null>(null);

  volunteerPreview = computed(() => this.volunteerPreviewShifts() !== null);

  /** The shifts to show: the organizer preview, or what the public may see. */
  volunteerShifts = computed(
    () => this.volunteerPreviewShifts() ?? this.tournament()?.volunteerShifts ?? [],
  );

  volunteerGroups = computed(() =>
    groupVolunteerShifts(this.volunteerShifts(), this.i18n.locale()),
  );

  volunteerSignupForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
  });

  ngOnInit(): void {
    const follow = this.route.snapshot.queryParamMap.get('follow');
    if (follow === 'confirmed') {
      this.followMessage.set({ text: "You're all set! We'll email you before this team's games.", ok: true });
    } else if (follow === 'unsubscribed') {
      this.followMessage.set({ text: "You've been unsubscribed. You won't get more reminders.", ok: true });
    } else if (follow === 'invalid') {
      this.followMessage.set({ text: 'That link is not valid any more.', ok: false });
    }

    this.tournamentsApi.getPublic(this.tournamentId).subscribe({
      next: (tournament) => {
        this.tournament.set(tournament);
        this.loading.set(false);
        this.loadVolunteerPreview();
        this.jumpToFragmentGame();
      },
      error: () => {
        this.error.set(this.i18n.t('This tournament could not be found.'));
        this.loading.set(false);
      },
    });

    this.loadStandings();
    this.loadLeaders();

    this.auctionApi.getPublic(this.tournamentId).subscribe({
      next: (view) =>
        this.auctionActive.set(
          view.auction.status === 'OPEN' || view.auction.status === 'CLOSED',
        ),
      error: () => this.auctionActive.set(false),
    });

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

    this.updateCountdown();
    this.countdownIntervalId = setInterval(
      () => this.updateCountdown(),
      COUNTDOWN_TICK_MS,
    );

    this.bannerIntervalId = setInterval(() => {
      const sponsors = this.bannerSponsors();

      if (sponsors.length > 1) {
        this.bannerIndex.set((this.bannerIndex() + 1) % sponsors.length);
      }
    }, BANNER_ROTATE_MS);
  }

  private jumpToFragmentGame(): void {
    const fragment = this.route.snapshot.fragment;

    if (!fragment?.startsWith('game-')) {
      return;
    }

    const gameId = fragment.slice('game-'.length);
    this.setTab('schedule');
    this.highlightedGameId.set(gameId);

    setTimeout(() => {
      document
        .getElementById(fragment)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);

    setTimeout(() => this.highlightedGameId.set(null), 5000);
  }

  private updateCountdown(): void {
    const startDate = this.tournament()?.startDate;

    if (!startDate) {
      this.countdownText.set(null);
      return;
    }

    const diffMs = new Date(startDate).getTime() - Date.now();

    if (diffMs <= 0) {
      this.countdownText.set(null);
      return;
    }

    const days = Math.floor(diffMs / 86400000);
    const hours = Math.floor((diffMs % 86400000) / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);

    const fr = this.i18n.lang() === 'fr';
    const [d, h, m, sec] = fr ? ['j', 'h', 'min', 's'] : ['d', 'h', 'm', 's'];
    const space = fr ? ' ' : '';

    this.countdownText.set(
      days > 0
        ? `${days}${space}${d} ${hours}${space}${h} ${minutes}${space}${m}`
        : `${hours}${space}${h} ${minutes}${space}${m} ${seconds}${space}${sec}`,
    );
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
              this.i18n.t("Payment received for {team}. You're all set.", {
                team: result.registration.teamName,
              }),
            );
          } else {
            this.paymentMessageIsError.set(true);
            this.paymentMessage.set(
              this.i18n.t('Your payment has not completed yet. It may still be processing.'),
            );
          }
        },
        error: () => {
          this.paymentVerifying.set(false);
          this.paymentMessageIsError.set(true);
          this.paymentMessage.set(this.i18n.t('Could not confirm this payment.'));
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

  setSearchQuery(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  filteredGames(): TournamentGame[] {
    const division = this.divisionFilter();
    let games = this.tournament()?.games ?? [];

    if (division) {
      const teams = this.tournament()?.teams ?? [];
      const divisionTeamIds = new Set(
        teams.filter((t) => t.division === division).map((t) => t.id),
      );

      // A game's own division wins (placeholder playoff slots and events
      // have no team ids yet); fall back to the teams for older data.
      games = games.filter((game) =>
        game.division
          ? game.division === division
          : (game.homeTeamId && divisionTeamIds.has(game.homeTeamId)) ||
            (game.awayTeamId && divisionTeamIds.has(game.awayTeamId)),
      );
    }

    const query = this.searchQuery().trim().toLowerCase();

    if (!query) {
      return games;
    }

    return games.filter(
      (game) =>
        game.homeTeamName.toLowerCase().includes(query) ||
        game.awayTeamName.toLowerCase().includes(query) ||
        (game.arenaName ?? '').toLowerCase().includes(query),
    );
  }

  /** Standings, one table per division (the API already ranks each division). */
  standingsByDivision(): { division: string | null; rows: TournamentStandingRow[] }[] {
    const groups = new Map<string | null, TournamentStandingRow[]>();

    for (const row of this.standings()) {
      const key = row.division ?? null;
      const list = groups.get(key) ?? [];
      list.push(row);
      groups.set(key, list);
    }

    return Array.from(groups.entries()).map(([division, rows]) => ({
      division,
      rows,
    }));
  }

  setCalendarTeam(event: Event): void {
    this.calendarTeamId.set((event.target as HTMLSelectElement).value || null);
  }

  gameCalendarLink(game: TournamentGame): string {
    const t = this.tournament();
    return googleGameLink(game, t?.name ?? '', this.tournamentId, t?.venues ?? [], window.location.origin);
  }

  /** The filtered schedule, grouped under one heading per calendar day. */
  gamesByDay(): { day: string; games: TournamentGame[] }[] {
    // At the same start time an event (e.g. the opening ceremony) comes
    // first, so "faceoff just before the final" reads in that order.
    const sorted = [...this.filteredGames()].sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime() ||
        Number(b.stage === 'EVENT') - Number(a.stage === 'EVENT'),
    );

    const groups = new Map<string, TournamentGame[]>();

    for (const game of sorted) {
      const day = new Date(game.startsAt).toLocaleDateString(this.i18n.locale(), {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      const list = groups.get(day) ?? [];
      list.push(game);
      groups.set(day, list);
    }

    return Array.from(groups.entries()).map(([day, games]) => ({
      day,
      games,
    }));
  }

  hasReferees(): boolean {
    return (this.tournament()?.games ?? []).some(
      (game) => (game.refereeAssignments?.length ?? 0) > 0,
    );
  }

  hasLivestreams(): boolean {
    return (this.tournament()?.games ?? []).some((game) => !!game.livestreamUrl);
  }

  /** Game, Time, Division, Matchup, Arena, Score + the optional columns. */
  scheduleColumnCount(): number {
    return 6 + (this.hasReferees() ? 1 : 0) + (this.hasLivestreams() ? 1 : 0);
  }

  filteredTeams(): TournamentTeam[] {
    const query = this.searchQuery().trim().toLowerCase();
    const teams = this.tournament()?.teams ?? [];

    if (!query) {
      return teams;
    }

    return teams.filter(
      (team) =>
        team.name.toLowerCase().includes(query) ||
        team.players.some((p) => p.displayName.toLowerCase().includes(query)),
    );
  }

  filteredLeaders(): TournamentPlayerLeaderRow[] {
    const query = this.searchQuery().trim().toLowerCase();
    const leaders = this.leaders();

    if (!query) {
      return leaders;
    }

    return leaders.filter(
      (leader) =>
        leader.displayName.toLowerCase().includes(query) ||
        leader.teamName.toLowerCase().includes(query),
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

    if (remaining === 1) return this.i18n.t('Final@@round');
    if (remaining === 2) return this.i18n.t('Semifinals');
    if (remaining === 3) return this.i18n.t('Quarterfinals');
    return this.i18n.t('Round {n}', { n: roundIndex + 1 });
  }

  trackByBracketId(_index: number, bracket: TournamentBracket): string {
    return bracket.id;
  }

  trackByMatchId(_index: number, match: TournamentBracketMatch): string {
    return match.id;
  }

  readonly sponsorTiers: TournamentSponsorTier[] = ['GOLD', 'SILVER', 'BRONZE'];

  sponsorsByTier(tier: string | null): TournamentSponsor[] {
    return (this.tournament()?.sponsors ?? []).filter(
      (s) => (s.tier ?? null) === tier,
    );
  }

  bannerSponsors(): TournamentSponsor[] {
    return this.sponsorsByTier('GOLD').filter((s) => !!s.logoUrl);
  }

  currentBannerSponsor(): TournamentSponsor | null {
    const sponsors = this.bannerSponsors();
    return sponsors.length > 0 ? sponsors[this.bannerIndex() % sponsors.length] : null;
  }

  venueMapUrl(venue: TournamentVenue): SafeResourceUrl | null {
    if (!venue.address) {
      return null;
    }

    const url = `https://maps.google.com/maps?q=${encodeURIComponent(venue.address)}&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  trackByVenueId(_index: number, venue: TournamentVenue): string {
    return venue.id;
  }

  trackBySponsorId(_index: number, sponsor: TournamentSponsor): string {
    return sponsor.id;
  }

  trackByMediaAssetId(_index: number, asset: TournamentMediaAsset): string {
    return asset.id;
  }

  trackByAnnouncementId(_index: number, announcement: { id: string }): string {
    return announcement.id;
  }

  trackByAnnouncementViewId(_index: number, item: { announcement: { id: string } }): string {
    return item.announcement.id;
  }

  /** The latest general announcements, ready to show in the visitor's language. */
  generalAnnouncementViews = computed(() =>
    (this.tournament()?.announcements ?? [])
      .filter((a) => a.type !== 'WEATHER')
      .slice(0, 3)
      .map((announcement) => {
        const view = parseAnnouncement(announcement.body, this.i18n.lang());
        return { announcement, view, summary: announcementSummary(view) };
      }),
  );

  /** Announcements the visitor has hidden (remembered on this device). Weather alerts cannot be hidden. */
  hiddenAnnouncementIds = signal<Set<string>>(readHiddenAnnouncements());

  isAnnouncementHidden(id: string): boolean {
    return this.hiddenAnnouncementIds().has(id);
  }

  toggleAnnouncement(id: string): void {
    const next = new Set(this.hiddenAnnouncementIds());
    if (!next.delete(id)) {
      next.add(id);
    }
    this.hiddenAnnouncementIds.set(next);
    saveHiddenAnnouncements(next);
  }

  /** Organizer-typed text (volunteer roles, notes) shown in the visitor's language. */
  pick(text: string | null | undefined): string {
    return pickLanguage(text, this.i18n.lang());
  }

  weatherAlerts(): Tournament['announcements'] {
    return (this.tournament()?.announcements ?? []).filter(
      (a) => a.type === 'WEATHER',
    );
  }

  readonly infoListingCategories: TournamentInfoListingCategory[] = [
    'HOTEL',
    'MERCHANDISE',
    'VENDOR',
  ];

  infoListingCategoryLabel(category: TournamentInfoListingCategory): string {
    if (category === 'HOTEL') return this.i18n.t('Hotels');
    if (category === 'MERCHANDISE') return this.i18n.t('Merchandise');
    return this.i18n.t('Vendors');
  }

  infoListingsByCategory(
    category: TournamentInfoListingCategory,
  ): TournamentInfoListing[] {
    return (this.tournament()?.infoListings ?? []).filter(
      (listing) => listing.category === category,
    );
  }

  trackByInfoListingId(_index: number, listing: TournamentInfoListing): string {
    return listing.id;
  }

  unclaimedLostFoundItems(): TournamentLostFoundItem[] {
    return (this.tournament()?.lostFoundItems ?? []).filter(
      (item) => item.status === 'UNCLAIMED',
    );
  }

  trackByLostFoundItemId(_index: number, item: TournamentLostFoundItem): string {
    return item.id;
  }

  /** Organizers see the volunteer shifts while sign-up is still closed to the public. */
  private loadVolunteerPreview(): void {
    if (this.tournament()?.volunteersOpen !== false || !this.authState.isLoggedIn()) {
      return;
    }

    // Anyone who is not an organizer of this tournament gets a 403, which just
    // means there is no preview for them.
    this.tournamentsApi.listVolunteerShifts(this.tournamentId).subscribe({
      next: (shifts) => this.volunteerPreviewShifts.set(shifts),
      error: () => this.volunteerPreviewShifts.set(null),
    });
  }

  spotsRemaining(shift: TournamentVolunteerShift): number | null {
    if (shift.capacity == null) {
      return null;
    }

    return Math.max(0, shift.capacity - (shift._count?.signups ?? 0));
  }

  trackByVolunteerShiftId(_index: number, shift: TournamentVolunteerShift): string {
    return shift.id;
  }

  toggleVolunteerSignup(shiftId: string): void {
    this.signingUpShiftId.set(
      this.signingUpShiftId() === shiftId ? null : shiftId,
    );
    this.volunteerSignupError.set(null);
    this.volunteerSignupForm.reset({ name: '', email: '', phone: '' });
  }

  submitVolunteerSignup(shiftId: string): void {
    if (this.volunteerSignupForm.invalid || this.submittingVolunteerSignup()) {
      this.volunteerSignupForm.markAllAsTouched();
      return;
    }

    const value = this.volunteerSignupForm.getRawValue();

    this.submittingVolunteerSignup.set(true);
    this.volunteerSignupError.set(null);

    const input = {
      name: value.name.trim(),
      email: value.email.trim(),
      phone: value.phone.trim() || null,
    };

    // While previewing, sign-up is still closed to the public, so organizers
    // add the name through their own endpoint (same form, same result). No
    // confirmation email goes out in that case.
    const request = this.volunteerPreview()
      ? this.tournamentsApi.addVolunteerToShift(this.tournamentId, shiftId, input)
      : this.tournamentsApi.signUpForVolunteerShift(this.tournamentId, shiftId, {
          ...input,
          lang: this.i18n.lang() === 'fr' ? 'fr' : 'en',
        });

    request.subscribe({
        next: (result) => {
          this.submittingVolunteerSignup.set(false);
          this.signingUpShiftId.set(null);
          this.volunteerSignupSuccessShiftId.set(shiftId);
          this.volunteerConfirmationEmailed.set(
            (result as { confirmationEmailSent?: boolean }).confirmationEmailSent === true,
          );
          this.tournamentsApi.getPublic(this.tournamentId).subscribe({
            next: (tournament) => {
              this.tournament.set(tournament);
              this.loadVolunteerPreview();
            },
          });
        },
        error: (err) => {
          this.volunteerSignupError.set(
            err?.error?.message || this.i18n.t('Could not sign up for this shift.'),
          );
          this.submittingVolunteerSignup.set(false);
        },
      });
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();

    if (this.countdownIntervalId !== null) {
      clearInterval(this.countdownIntervalId);
    }

    if (this.bannerIntervalId !== null) {
      clearInterval(this.bannerIntervalId);
    }
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
            err?.error?.message || this.i18n.t('Could not submit your registration.'),
          );
          this.submittingRegistration.set(false);
        },
      });
  }
}
