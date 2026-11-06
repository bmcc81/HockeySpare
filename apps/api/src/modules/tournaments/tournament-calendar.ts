/**
 * iCalendar (.ics) feed for a tournament team's games, so players can add the
 * schedule to Google Calendar, Apple Calendar or Outlook. People subscribe to
 * the feed URL, so a changed time or a new playoff opponent shows up in their
 * calendar without doing anything.
 */

export interface CalendarGame {
  id: string;
  gameNumber: string | null;
  division: string | null;
  stage: 'ROUND_ROBIN' | 'PLAYOFF' | 'EXHIBITION' | 'EVENT';
  startsAt: Date;
  arenaName: string | null;
  homeTeamName: string;
  awayTeamName: string;
  status: 'SCHEDULED' | 'LIVE' | 'FINAL';
  homeScore: number | null;
  awayScore: number | null;
  updatedAt: Date;
}

export interface CalendarVenue {
  name: string;
  address: string | null;
}

export interface CalendarOptions {
  calendarName: string;
  tournamentId: string;
  tournamentName: string;
  /** e.g. https://hockeyspare.webinkgraphics.com */
  origin: string;
  games: CalendarGame[];
  venues: CalendarVenue[];
  now: Date;
  /** How long each game block is shown for. */
  gameMinutes?: number;
}

/** Escape text values per RFC 5545. */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Fold a content line to 75 octets, never splitting a multi-byte character. */
export function foldIcsLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;

  const parts: string[] = [];
  let current = '';
  let bytes = 0;
  let limit = 75;

  for (const ch of line) {
    const size = encoder.encode(ch).length;
    if (bytes + size > limit) {
      parts.push(current);
      current = '';
      bytes = 0;
      limit = 74; // continuation lines start with a space
    }
    current += ch;
    bytes += size;
  }
  parts.push(current);

  return parts.join('\r\n ');
}

/** 20261116T230000Z */
export function formatIcsUtc(date: Date): string {
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return (
    `${p(date.getUTCFullYear(), 4)}${p(date.getUTCMonth() + 1)}${p(date.getUTCDate())}` +
    `T${p(date.getUTCHours())}${p(date.getUTCMinutes())}${p(date.getUTCSeconds())}Z`
  );
}

/** Find the venue an arena name refers to ("PFDS 2" -> "PFDS - Pierrefonds Sportplexe ..."). */
export function venueForArena(arenaName: string | null, venues: CalendarVenue[]): CalendarVenue | null {
  if (!arenaName) return null;

  const arena = arenaName.trim().toLowerCase();
  const code = arena.split(/\s+/)[0];

  return (
    venues.find((v) => v.name.toLowerCase().startsWith(code)) ??
    venues.find((v) => v.name.toLowerCase().includes(arena)) ??
    null
  );
}

export function locationFor(arenaName: string | null, venues: CalendarVenue[]): string {
  if (!arenaName) return '';
  const venue = venueForArena(arenaName, venues);
  const address = venue?.address?.trim();
  return address ? `${arenaName}, ${address}` : arenaName;
}

function stageLabel(game: CalendarGame): string {
  if (game.stage === 'PLAYOFF') return 'Playoff';
  if (game.stage === 'EXHIBITION') return 'Exhibition';
  return 'Round robin';
}

export function buildIcs(options: CalendarOptions): string {
  const minutes = options.gameMinutes ?? 60;
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HockeySpare//Tournament schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(options.calendarName)}`,
    `X-WR-CALDESC:${escapeIcsText(`${options.tournamentName} - schedule from HockeySpare`)}`,
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
  ];

  const stamp = formatIcsUtc(options.now);
  const sorted = [...options.games].sort(
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime() || (a.gameNumber ?? '').localeCompare(b.gameNumber ?? ''),
  );

  for (const game of sorted) {
    const end = new Date(game.startsAt.getTime() + minutes * 60_000);
    const summary = `${game.homeTeamName} vs ${game.awayTeamName}${game.gameNumber ? ` (${game.gameNumber})` : ''}`;
    const details = [
      options.tournamentName,
      [game.division ? `Division ${game.division}` : '', stageLabel(game), game.gameNumber ? `Game ${game.gameNumber}` : '']
        .filter(Boolean)
        .join(' · '),
      game.status === 'FINAL' && game.homeScore != null && game.awayScore != null
        ? `Final: ${game.homeTeamName} ${game.homeScore} - ${game.awayScore} ${game.awayTeamName}`
        : '',
      `Live scores and standings: ${options.origin}/tournaments/${options.tournamentId}#game-${game.id}`,
    ]
      .filter(Boolean)
      .join('\n');

    lines.push(
      'BEGIN:VEVENT',
      `UID:game-${game.id}@hockeyspare`,
      `DTSTAMP:${stamp}`,
      `LAST-MODIFIED:${formatIcsUtc(game.updatedAt)}`,
      `DTSTART:${formatIcsUtc(game.startsAt)}`,
      `DTEND:${formatIcsUtc(end)}`,
      `SUMMARY:${escapeIcsText(summary)}`,
      `DESCRIPTION:${escapeIcsText(details)}`,
    );

    const location = locationFor(game.arenaName, options.venues);
    if (location) lines.push(`LOCATION:${escapeIcsText(location)}`);

    lines.push(
      `URL:${options.origin}/tournaments/${options.tournamentId}#game-${game.id}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');

  return lines.map(foldIcsLine).join('\r\n') + '\r\n';
}
