import type { TournamentGame, TournamentVenue } from '@hockeyspare/contracts';
import {
  googleGameLink,
  googleSubscribeUrl,
  teamCalendarFeedUrl,
  webcalUrl,
} from './calendar-links';

describe('calendar links', () => {
  const feed = teamCalendarFeedUrl('https://site.example', 't1', 'team 2');

  it('points at the team feed', () => {
    expect(feed).toBe('https://site.example/api/tournaments/t1/calendar.ics?team=team%202');
  });

  it('turns the feed into a Google subscribe link and a webcal link', () => {
    expect(webcalUrl(feed)).toBe('webcal://site.example/api/tournaments/t1/calendar.ics?team=team%202');
    const google = googleSubscribeUrl(feed);
    expect(google.startsWith('https://calendar.google.com/calendar/r?cid=webcal')).toBe(true);
    expect(decodeURIComponent(google.split('cid=')[1])).toBe(webcalUrl(feed));
  });

  it('builds a one-game Google Calendar link with times in UTC, the venue and a link back', () => {
    const game = {
      id: 'g1',
      gameNumber: 'A3',
      division: '35B',
      startsAt: '2026-11-17T00:00:00.000Z',
      arenaName: 'PFDS 2',
      homeTeamName: 'EAGLES',
      awayTeamName: 'WROUGES',
    } as unknown as TournamentGame;
    const venues = [
      { name: 'PFDS - Pierrefonds Sportplexe', address: '14700 Boul. Pierrefonds' },
    ] as TournamentVenue[];

    const url = new URL(googleGameLink(game, 'Oldtimers', 't1', venues, 'https://site.example'));

    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('text')).toBe('EAGLES vs WROUGES (A3)');
    expect(url.searchParams.get('dates')).toBe('20261117T000000Z/20261117T010000Z');
    expect(url.searchParams.get('location')).toBe('PFDS 2, 14700 Boul. Pierrefonds');
    expect(url.searchParams.get('details')).toContain('https://site.example/tournaments/t1#game-g1');
  });
});
