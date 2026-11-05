import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  Tournament,
  TournamentGame,
  TournamentGameStatus,
  TournamentStandingRow,
  TournamentTeam,
} from '@hockeyspare/contracts';
import { Subscription, interval } from 'rxjs';
import { TournamentsApiService } from '../../core/services/tournaments-api.service';

const REFRESH_MS = 30000;
const SAVE_DEBOUNCE_MS = 600;

type Side = 'home' | 'away';
type Draft = { home: number; away: number; status: TournamentGameStatus };
type SaveState = 'saving' | 'saved' | 'error';

/**
 * Phone-first score entry for the people working the rinks. Each goal tap
 * auto-saves, "Final" needs a second confirming tap, and playoff slots can be
 * given their teams (with a suggestion from the standings) before scoring.
 */
@Component({
  selector: 'app-tournament-scores',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './tournament-scores.html',
})
export class TournamentScoresComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(TournamentsApiService);

  private refreshSub: Subscription | null = null;
  private readonly saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

  tournamentId = this.route.snapshot.paramMap.get('id') ?? '';

  tournament = signal<Tournament | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  /** null until we know; false = signed in but not allowed to change scores. */
  canEdit = signal<boolean | null>(null);

  selectedDay = signal<string | null>(null);
  divisionFilter = signal('');
  search = signal('');

  private drafts = signal<Record<string, Draft>>({});
  saveState = signal<Record<string, SaveState>>({});
  saveError = signal<Record<string, string>>({});
  confirmFinalId = signal<string | null>(null);

  teamsPanelId = signal<string | null>(null);
  panelStandings = signal<TournamentStandingRow[]>([]);
  teamsDraft = signal<{ home: string; away: string }>({ home: '', away: '' });
  suggestionNote = signal<string | null>(null);
  savingTeams = signal(false);
  teamsError = signal<string | null>(null);

  ngOnInit(): void {
    this.load(true);

    this.api.listCoOrganizers(this.tournamentId).subscribe({
      next: () => this.canEdit.set(true),
      error: () => this.canEdit.set(false),
    });

    this.refreshSub = interval(REFRESH_MS).subscribe(() => {
      if (this.saveTimers.size === 0 && !this.anySaving()) {
        this.load(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
    this.saveTimers.forEach((timer) => clearTimeout(timer));
  }

  load(initial: boolean): void {
    this.api.getPublic(this.tournamentId).subscribe({
      next: (tournament) => {
        this.tournament.set(tournament);
        this.loading.set(false);

        if (initial || !this.selectedDay()) {
          this.selectedDay.set(this.defaultDay(tournament));
        }
      },
      error: () => {
        if (initial) {
          this.error.set('This tournament could not be loaded.');
        }
        this.loading.set(false);
      },
    });
  }

  // ---- filters ---------------------------------------------------------

  private dayKey(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  private scorable(): TournamentGame[] {
    return (this.tournament()?.games ?? []).filter((g) => g.stage !== 'EVENT');
  }

  days(): { key: string; label: string }[] {
    const keys = Array.from(
      new Set(this.scorable().map((g) => this.dayKey(g.startsAt))),
    ).sort();

    return keys.map((key) => {
      const [y, m, d] = key.split('-').map(Number);
      return {
        key,
        label: new Date(y, m - 1, d).toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
      };
    });
  }

  private defaultDay(tournament: Tournament): string | null {
    const keys = Array.from(
      new Set(
        tournament.games
          .filter((g) => g.stage !== 'EVENT')
          .map((g) => this.dayKey(g.startsAt)),
      ),
    ).sort();

    if (keys.length === 0) {
      return null;
    }

    const today = this.dayKey(new Date().toISOString());
    return keys.includes(today) ? today : keys.find((k) => k > today) ?? keys[0];
  }

  divisions(): string[] {
    return Array.from(
      new Set(this.scorable().map((g) => g.division).filter((d): d is string => !!d)),
    ).sort();
  }

  games(): TournamentGame[] {
    const day = this.selectedDay();
    const division = this.divisionFilter();
    const query = this.search().trim().toLowerCase();

    return this.scorable()
      .filter((g) => !day || this.dayKey(g.startsAt) === day)
      .filter((g) => !division || g.division === division)
      .filter(
        (g) =>
          !query ||
          g.homeTeamName.toLowerCase().includes(query) ||
          g.awayTeamName.toLowerCase().includes(query) ||
          (g.arenaName ?? '').toLowerCase().includes(query) ||
          (g.gameNumber ?? '').toLowerCase() === query,
      )
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime() ||
          (a.gameNumber ?? '').localeCompare(b.gameNumber ?? ''),
      );
  }

  setDay(key: string): void {
    this.selectedDay.set(key);
  }

  setDivision(event: Event): void {
    this.divisionFilter.set((event.target as HTMLSelectElement).value);
  }

  setSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  // ---- what to show for a game ----------------------------------------

  private view(game: TournamentGame): Draft {
    return (
      this.drafts()[game.id] ?? {
        home: game.homeScore ?? 0,
        away: game.awayScore ?? 0,
        status: game.status,
      }
    );
  }

  score(game: TournamentGame, side: Side): number {
    return this.view(game)[side];
  }

  status(game: TournamentGame): TournamentGameStatus {
    return this.view(game).status;
  }

  /** A playoff slot that still shows a placeholder instead of real teams. */
  needsTeams(game: TournamentGame): boolean {
    return game.stage === 'PLAYOFF' && (!game.homeTeamId || !game.awayTeamId);
  }

  anySaving(): boolean {
    return Object.values(this.saveState()).includes('saving');
  }

  // ---- scoring ---------------------------------------------------------

  bump(game: TournamentGame, side: Side, delta: number): void {
    const current = this.view(game);

    if (!this.canEdit() || current.status === 'FINAL' || this.needsTeams(game)) {
      return;
    }

    this.confirmFinalId.set(null);
    this.setDraft(game.id, {
      ...current,
      [side]: Math.max(0, current[side] + delta),
      // The first goal means the game is under way.
      status: current.status === 'SCHEDULED' ? 'LIVE' : current.status,
    });
    this.scheduleSave(game);
  }

  startGame(game: TournamentGame): void {
    if (!this.canEdit() || this.needsTeams(game)) {
      return;
    }

    this.setDraft(game.id, { ...this.view(game), status: 'LIVE' });
    this.saveNow(game);
  }

  askFinal(game: TournamentGame): void {
    const v = this.view(game);

    if (game.stage === 'PLAYOFF' && v.home === v.away) {
      this.setError(
        game.id,
        'Playoff games cannot end tied. Add the overtime or shootout winner’s goal first.',
      );
      return;
    }

    this.setError(game.id, null);
    this.confirmFinalId.set(game.id);
  }

  cancelFinal(): void {
    this.confirmFinalId.set(null);
  }

  confirmFinal(game: TournamentGame): void {
    this.confirmFinalId.set(null);
    this.setDraft(game.id, { ...this.view(game), status: 'FINAL' });
    this.saveNow(game);
  }

  reopen(game: TournamentGame): void {
    if (!this.canEdit()) {
      return;
    }

    this.setDraft(game.id, { ...this.view(game), status: 'LIVE' });
    this.saveNow(game);
  }

  retry(game: TournamentGame): void {
    this.saveNow(game);
  }

  private setDraft(id: string, draft: Draft): void {
    this.drafts.update((all) => ({ ...all, [id]: draft }));
  }

  private setState(id: string, state: SaveState | null): void {
    this.saveState.update((all) => {
      const next = { ...all };
      if (state) next[id] = state;
      else delete next[id];
      return next;
    });
  }

  private setError(id: string, message: string | null): void {
    this.saveError.update((all) => {
      const next = { ...all };
      if (message) next[id] = message;
      else delete next[id];
      return next;
    });
  }

  private scheduleSave(game: TournamentGame): void {
    const existing = this.saveTimers.get(game.id);

    if (existing) {
      clearTimeout(existing);
    }

    this.setError(game.id, null);
    this.saveTimers.set(
      game.id,
      setTimeout(() => {
        this.saveTimers.delete(game.id);
        this.saveNow(game);
      }, SAVE_DEBOUNCE_MS),
    );
  }

  private saveNow(game: TournamentGame): void {
    const draft = this.drafts()[game.id];

    if (!draft) {
      return;
    }

    this.setState(game.id, 'saving');
    this.setError(game.id, null);

    this.api
      .updateGameScore(this.tournamentId, game.id, {
        homeScore: draft.home,
        awayScore: draft.away,
        status: draft.status,
      })
      .subscribe({
        next: (updated) => {
          this.mergeGame(updated);
          this.setState(game.id, 'saved');

          // Keep the draft if more taps arrived while this save was in flight.
          const latest = this.drafts()[game.id];
          if (
            latest &&
            latest.home === draft.home &&
            latest.away === draft.away &&
            latest.status === draft.status
          ) {
            this.drafts.update((all) => {
              const next = { ...all };
              delete next[game.id];
              return next;
            });
          }
        },
        error: (err) => {
          this.setState(game.id, 'error');
          this.setError(
            game.id,
            err?.status === 403
              ? 'You don’t have permission to change scores for this tournament.'
              : err?.error?.message || 'Could not save. Check your connection and tap retry.',
          );
        },
      });
  }

  private mergeGame(updated: TournamentGame): void {
    this.tournament.update((t) =>
      t
        ? {
            ...t,
            games: t.games.map((g) =>
              g.id === updated.id ? { ...g, ...updated } : g,
            ),
          }
        : t,
    );
  }

  // ---- giving a playoff slot its teams ---------------------------------

  teamsFor(game: TournamentGame): TournamentTeam[] {
    return (this.tournament()?.teams ?? [])
      .filter((t) => !game.division || t.division === game.division)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  openTeams(game: TournamentGame): void {
    this.teamsPanelId.set(game.id);
    this.teamsError.set(null);
    this.suggestionNote.set(null);
    this.teamsDraft.set({
      home: game.homeTeamId ?? '',
      away: game.awayTeamId ?? '',
    });
    this.panelStandings.set([]);

    this.api.getStandings(this.tournamentId, game.division).subscribe({
      next: (rows) => {
        this.panelStandings.set(rows);
        this.applySuggestion(game, rows);
      },
      error: () => undefined,
    });
  }

  closeTeams(): void {
    this.teamsPanelId.set(null);
  }

  setTeam(side: Side, event: Event): void {
    this.teamsDraft.update((d) => ({
      ...d,
      [side]: (event.target as HTMLSelectElement).value,
    }));
  }

  private teamIdByName(name: string): string {
    return (this.tournament()?.teams ?? []).find((t) => t.name === name)?.id ?? '';
  }

  private winnerId(game: TournamentGame): string {
    if (game.status !== 'FINAL' || game.homeScore == null || game.awayScore == null) {
      return '';
    }

    return (
      (game.homeScore > game.awayScore ? game.homeTeamId : game.awayTeamId) ?? ''
    );
  }

  /**
   * Fill the two selects from the standings. "1st place"/"4th place" slots
   * take that place; "Finalist 1/2" slots take the semi-final winners when the
   * division has semi-finals, otherwise the top two. It is only a suggestion:
   * nothing is saved until the organizer taps Save.
   */
  private applySuggestion(game: TournamentGame, rows: TournamentStandingRow[]): void {
    const byPlace = (n: number) => this.teamIdByName(rows[n - 1]?.teamName ?? '');
    const semis = (this.tournament()?.games ?? [])
      .filter(
        (g) =>
          g.division === game.division &&
          g.stage === 'PLAYOFF' &&
          /^SEMI/i.test(g.homeTeamName),
      )
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime() ||
          (a.gameNumber ?? '').localeCompare(b.gameNumber ?? ''),
      );

    const resolve = (placeholder: string): string => {
      const place = /(\d+)(?:st|nd|rd|th) place/i.exec(placeholder);
      if (place) {
        return byPlace(Number(place[1]));
      }

      const finalist = /finalist (\d)/i.exec(placeholder);
      if (finalist) {
        const n = Number(finalist[1]);
        return semis.length > 0 ? this.winnerId(semis[n - 1] ?? game) : byPlace(n);
      }

      return '';
    };

    const home = this.teamsDraft().home || resolve(game.homeTeamName);
    const away = this.teamsDraft().away || resolve(game.awayTeamName);
    this.teamsDraft.set({ home, away });

    this.suggestionNote.set(
      home && away
        ? 'Suggested from the standings — check, then save.'
        : 'Pick both teams. (The standings or semi-finals aren’t settled enough to suggest them yet.)',
    );
  }

  saveTeams(game: TournamentGame): void {
    const { home, away } = this.teamsDraft();

    if (!home || !away || home === away) {
      this.teamsError.set('Choose two different teams.');
      return;
    }

    this.savingTeams.set(true);
    this.teamsError.set(null);

    this.api
      .updateGame(this.tournamentId, game.id, { homeTeamId: home, awayTeamId: away })
      .subscribe({
        next: (updated) => {
          this.mergeGame(updated);
          this.savingTeams.set(false);
          this.teamsPanelId.set(null);
        },
        error: (err) => {
          this.teamsError.set(err?.error?.message || 'Could not save the teams.');
          this.savingTeams.set(false);
        },
      });
  }

  trackByGameId(_index: number, game: TournamentGame): string {
    return game.id;
  }
}
