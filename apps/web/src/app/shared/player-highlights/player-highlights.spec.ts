import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PlayerHighlightsComponent } from './player-highlights';

describe('PlayerHighlightsComponent', () => {
  it('preserves standings during a refresh failure and replaces them after retry', () => {
    const fixture = TestBed.createComponent(PlayerHighlightsComponent);
    fixture.componentRef.setInput('scope', 'tournament');
    fixture.componentRef.setInput('competitionId', 'cup');
    fixture.componentRef.setInput('refreshKey', 1);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const board = {
      scopeLabel: 'Cup',
      weekStart: '2026-09-15',
      asOf: '2026-09-22',
      pointLeaders: [
        {
          playerId: '1',
          displayName: 'Alex',
          teamName: 'Stars',
          competitionName: 'Cup',
          gamesPlayed: 1,
          goals: 2,
          assists: 1,
          points: 3,
          penaltyMins: 2,
          rank: 1,
        },
      ],
      playersOfTheWeek: [],
    };
    http.expectOne('/api/player-highlights/tournaments/cup').flush(board);
    fixture.detectChanges();
    fixture.componentRef.setInput('refreshKey', 2);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.total').textContent.trim(),
    ).toBe('3');
    http
      .expectOne('/api/player-highlights/tournaments/cup')
      .flush({}, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Showing the last loaded results',
    );
    expect(
      fixture.nativeElement.querySelector('.total').textContent.trim(),
    ).toBe('3');
    fixture.nativeElement.querySelector('button').click();
    http.expectOne('/api/player-highlights/tournaments/cup').flush({
      ...board,
      pointLeaders: [{ ...board.pointLeaders[0], goals: 3, points: 4 }],
    });
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.total').textContent.trim(),
    ).toBe('4');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });

  it('clears the previous competition when the scope changes', () => {
    const fixture = TestBed.createComponent(PlayerHighlightsComponent);
    fixture.componentRef.setInput('scope', 'home');
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/player-highlights').flush({
      scopeLabel: 'Public tournaments',
      weekStart: '2026-09-15',
      asOf: '2026-09-22',
      pointLeaders: [],
      playersOfTheWeek: [],
    });
    fixture.componentRef.setInput('scope', 'league');
    fixture.componentRef.setInput('competitionId', 'league-2');
    fixture.detectChanges();
    expect(fixture.componentInstance.data()).toBeNull();
    http
      .expectOne('/api/leagues/league-2/player-highlights')
      .flush({}, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain(
      'Public tournaments',
    );
  });
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [PlayerHighlightsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }),
  );
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('loads the home board and explains empty results', () => {
    const fixture = TestBed.createComponent(PlayerHighlightsComponent);
    fixture.componentRef.setInput('scope', 'home');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Loading player highlights',
    );
    TestBed.inject(HttpTestingController)
      .expectOne('/api/player-highlights')
      .flush({
        scopeLabel: 'Public tournaments',
        weekStart: '2026-09-15',
        asOf: '2026-09-22',
        pointLeaders: [],
        playersOfTheWeek: [],
      });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'No completed game stats yet',
    );
    expect(fixture.nativeElement.textContent).toContain(
      'The next stars are still to come',
    );
  });

  it('uses the guarded league endpoint and allows retry after failure', () => {
    const fixture = TestBed.createComponent(PlayerHighlightsComponent);
    fixture.componentRef.setInput('scope', 'league');
    fixture.componentRef.setInput('competitionId', 'league-1');
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http
      .expectOne('/api/leagues/league-1/player-highlights')
      .flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('could not be loaded');
    fixture.nativeElement.querySelector('button').click();
    http.expectOne('/api/leagues/league-1/player-highlights').flush({
      scopeLabel: 'League',
      weekStart: '2026-09-15',
      asOf: '2026-09-22',
      pointLeaders: [],
      playersOfTheWeek: [],
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });

  it('renders player stats and filters leaders without refetching the board', () => {
    const fixture = TestBed.createComponent(PlayerHighlightsComponent);
    fixture.componentRef.setInput('scope', 'tournament');
    fixture.componentRef.setInput('competitionId', 'cup');
    fixture.detectChanges();
    const player = {
      playerId: '1',
      displayName: 'Alex Smith',
      teamName: 'North Stars',
      competitionName: 'Cup',
      gamesPlayed: 2,
      goals: 3,
      assists: 2,
      points: 5,
      rank: 1,
    };
    TestBed.inject(HttpTestingController)
      .expectOne('/api/player-highlights/tournaments/cup')
      .flush({
        scopeLabel: 'Cup',
        weekStart: '2026-09-15',
        asOf: '2026-09-22',
        pointLeaders: [player],
        playersOfTheWeek: [player],
      });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.star').textContent).toContain(
      'Alex Smith',
    );
    expect(
      fixture.nativeElement.querySelector('.total').textContent.trim(),
    ).toBe('5');
    fixture.componentRef.setInput('searchTerm', 'missing');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'No players match your search',
    );
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(0);
    fixture.componentRef.setInput('searchTerm', 'north');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(1);
  });
});
