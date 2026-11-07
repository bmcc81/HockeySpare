import type { TournamentGame, TournamentVenue } from '@hockeyspare/contracts';

const GAME_MINUTES = 60;

/** The calendar feed for one team (`.ics`); subscribing keeps it up to date. */
export function teamCalendarFeedUrl(origin: string, tournamentId: string, teamId: string): string {
  return `${origin}/api/tournaments/${encodeURIComponent(tournamentId)}/calendar.ics?team=${encodeURIComponent(teamId)}`;
}

/** Opens Google Calendar's "add calendar by URL" for a feed, via the webcal:// scheme it understands. */
export function googleSubscribeUrl(feedUrl: string): string {
  return `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(feedUrl.replace(/^https?:/, 'webcal:'))}`;
}

/**
 * The subscribe link for Apple Calendar and Outlook. A plain `webcal://` link
 * is treated as http:// by iOS, which warns "Insecure Connection" even though
 * the site is https. Apple devices understand `webcals://` (the secure
 * version), so use it for them when the feed is https.
 */
export function webcalUrl(feedUrl: string, userAgent = ''): string {
  const apple = /iPhone|iPad|iPod|Macintosh/i.test(userAgent);
  const scheme = apple && feedUrl.startsWith('https:') ? 'webcals:' : 'webcal:';
  return feedUrl.replace(/^https?:/, scheme);
}

/** 20261116T230000Z */
function utcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function locationFor(arenaName: string | null | undefined, venues: TournamentVenue[]): string {
  if (!arenaName) return '';

  const arena = arenaName.trim().toLowerCase();
  const code = arena.split(/\s+/)[0];
  const venue =
    venues.find((v) => v.name.toLowerCase().startsWith(code)) ??
    venues.find((v) => v.name.toLowerCase().includes(arena));
  const address = venue?.address?.trim();

  return address ? `${arenaName}, ${address}` : arenaName;
}

/** A one-game "add to Google Calendar" link. */
export function googleGameLink(
  game: TournamentGame,
  tournamentName: string,
  tournamentId: string,
  venues: TournamentVenue[],
  origin: string,
): string {
  const start = new Date(game.startsAt);
  const end = new Date(start.getTime() + GAME_MINUTES * 60_000);
  const title = `${game.homeTeamName} vs ${game.awayTeamName}${game.gameNumber ? ` (${game.gameNumber})` : ''}`;
  const details = [
    tournamentName,
    game.division ? `Division ${game.division}` : '',
    `${origin}/tournaments/${tournamentId}#game-${game.id}`,
  ]
    .filter(Boolean)
    .join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${utcStamp(start)}/${utcStamp(end)}`,
    details,
    location: locationFor(game.arenaName, venues),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
