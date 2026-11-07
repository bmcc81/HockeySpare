import { TournamentVolunteerShift } from '@hockeyspare/contracts';

export interface VolunteerArenaGroup {
  /** Arena / location name, or null for shifts without one. */
  arena: string | null;
  shifts: TournamentVolunteerShift[];
}

export interface VolunteerDayGroup {
  /** Heading such as "Monday, November 16". */
  day: string;
  arenas: VolunteerArenaGroup[];
}

/**
 * Groups shifts under one heading per calendar day, then per arena, so a long
 * list of shifts reads as "Monday > Île Bizard > timekeepers, referees...".
 * Shifts are ordered by start time, then role; arenas keep the order in which
 * they first appear that day.
 */
export function groupVolunteerShifts(
  shifts: readonly TournamentVolunteerShift[],
  locale: string,
): VolunteerDayGroup[] {
  const sorted = [...shifts].sort(
    (a, b) =>
      new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime() ||
      a.role.localeCompare(b.role),
  );

  const days = new Map<string, Map<string, VolunteerArenaGroup>>();

  for (const shift of sorted) {
    const day = new Date(shift.startsAt).toLocaleDateString(locale, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    const arenaName = shift.location?.trim() || null;
    const arenas = days.get(day) ?? new Map<string, VolunteerArenaGroup>();
    const group = arenas.get(arenaName ?? '') ?? {
      arena: arenaName,
      shifts: [],
    };

    group.shifts.push(shift);
    arenas.set(arenaName ?? '', group);
    days.set(day, arenas);
  }

  return Array.from(days.entries()).map(([day, arenas]) => ({
    day,
    arenas: Array.from(arenas.values()),
  }));
}
