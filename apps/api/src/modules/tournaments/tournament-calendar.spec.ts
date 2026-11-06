import {
  CalendarGame,
  CalendarVenue,
  buildIcs,
  escapeIcsText,
  foldIcsLine,
  formatIcsUtc,
  locationFor,
} from './tournament-calendar';

const venues: CalendarVenue[] = [
  { name: 'CSSR - Centre Sportif Saint-Raphael', address: '750 Boul. Jacques-Bizard, L\'Ile Bizard, QC H9C 2Y2' },
  { name: 'PFDS - Pierrefonds Sportplexe (rinks 1 & 2)', address: '14700 Boul. Pierrefonds, Pierrefonds, QC H9H 4Y6' },
];

const game = (overrides: Partial<CalendarGame> = {}): CalendarGame => ({
  id: 'g1',
  gameNumber: 'A3',
  division: '35B',
  stage: 'ROUND_ROBIN',
  startsAt: new Date(Date.UTC(2026, 10, 17, 0, 0, 0)), // Nov 16, 7 PM Montreal
  arenaName: 'PFDS 2',
  homeTeamName: 'ILE BIZARD ALL STARS',
  awayTeamName: 'EAGLES',
  status: 'SCHEDULED',
  homeScore: null,
  awayScore: null,
  updatedAt: new Date(Date.UTC(2026, 10, 5, 12, 0, 0)),
  ...overrides,
});

const build = (games: CalendarGame[]) =>
  buildIcs({
    calendarName: 'EAGLES - Pierrefonds Oldtimers',
    tournamentId: 'abc',
    tournamentName: 'Pierrefonds Oldtimers Tournament',
    origin: 'https://site.example',
    games,
    venues,
    now: new Date(Date.UTC(2026, 10, 6, 15, 0, 0)),
  });

describe('ICS helpers', () => {
  it('formats UTC timestamps', () => {
    expect(formatIcsUtc(new Date(Date.UTC(2026, 10, 17, 0, 5, 9)))).toBe('20261117T000509Z');
  });

  it('escapes commas, semicolons, backslashes and newlines', () => {
    expect(escapeIcsText('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne');
  });

  it('folds long lines at 75 bytes without splitting characters', () => {
    const long = 'SUMMARY:' + 'é'.repeat(100);
    const folded = foldIcsLine(long);
    const physical = folded.split('\r\n');
    expect(physical.length).toBeGreaterThan(1);
    for (const line of physical) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
    expect(physical.slice(1).every((l) => l.startsWith(' '))).toBe(true);
    expect(physical.map((l, i) => (i === 0 ? l : l.slice(1))).join('')).toBe(long);
  });

  it('finds the venue address from a short arena name', () => {
    expect(locationFor('PFDS 2', venues)).toBe('PFDS 2, 14700 Boul. Pierrefonds, Pierrefonds, QC H9H 4Y6');
    expect(locationFor('CSSR', venues)).toContain('750 Boul. Jacques-Bizard');
    expect(locationFor('Mystery Arena', venues)).toBe('Mystery Arena');
    expect(locationFor(null, venues)).toBe('');
  });
});

describe('buildIcs', () => {
  it('produces a valid-looking calendar with one event per game', () => {
    const ics = build([game(), game({ id: 'g2', gameNumber: 'A7', startsAt: new Date(Date.UTC(2026, 10, 20, 23, 0, 0)) })]);

    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain('X-WR-CALNAME:EAGLES - Pierrefonds Oldtimers');
    expect(ics).toContain('UID:game-g1@hockeyspare');
    expect(ics).toContain('DTSTART:20261117T000000Z');
    expect(ics).toContain('DTEND:20261117T010000Z');
    expect(ics).toContain('SUMMARY:ILE BIZARD ALL STARS vs EAGLES (A3)');
    expect(ics).toContain('LOCATION:PFDS 2\\, 14700 Boul. Pierrefonds\\, Pierrefonds\\, QC H9H 4Y6');
    expect(ics).toContain('https://site.example/tournaments/abc#game-g1');
    expect(ics.split('\r\n').every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
  });

  it('lists games in time order', () => {
    const ics = build([
      game({ id: 'late', startsAt: new Date(Date.UTC(2026, 10, 21, 0, 0, 0)) }),
      game({ id: 'early', startsAt: new Date(Date.UTC(2026, 10, 17, 0, 0, 0)) }),
    ]);
    expect(ics.indexOf('game-early')).toBeLessThan(ics.indexOf('game-late'));
  });

  it('adds the final score once a game is over', () => {
    const ics = build([game({ status: 'FINAL', homeScore: 2, awayScore: 1 })]);
    expect(ics.replace(/\r\n /g, '')).toContain('Final: ILE BIZARD ALL STARS 2 - 1 EAGLES');
  });

  it('is an empty but valid calendar with no games', () => {
    const ics = build([]);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).not.toContain('BEGIN:VEVENT');
  });
});
