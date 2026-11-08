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

export interface VolunteerGridRow {
  startsAt: string;
  endsAt: string;
  /** One entry per arena column; empty when nothing is scheduled there at this time. */
  cells: TournamentVolunteerShift[][];
}

export interface VolunteerGridDay {
  day: string;
  /** Column headings; null is the "no arena" column. */
  arenas: (string | null)[];
  rows: VolunteerGridRow[];
}

/**
 * The same shifts laid out as a grid for each day: one column per arena, one
 * row per time slot, so an organizer sees at a glance who covers what, where.
 * Slots with the same start and end share a row.
 */
export function buildVolunteerGrid(
  shifts: readonly TournamentVolunteerShift[],
  locale: string,
): VolunteerGridDay[] {
  return groupVolunteerShifts(shifts, locale).map(({ day, arenas }) => {
    const rows = new Map<string, VolunteerGridRow>();

    arenas.forEach((group, column) => {
      for (const shift of group.shifts) {
        const key = `${new Date(shift.startsAt).getTime()}|${new Date(shift.endsAt).getTime()}`;
        const row = rows.get(key) ?? {
          startsAt: shift.startsAt,
          endsAt: shift.endsAt,
          cells: arenas.map(() => [] as TournamentVolunteerShift[]),
        };

        row.cells[column].push(shift);
        rows.set(key, row);
      }
    });

    return {
      day,
      arenas: arenas.map((a) => a.arena),
      rows: Array.from(rows.values()).sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime() ||
          new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime(),
      ),
    };
  });
}

/** Empty lines to leave on a printed sheet so names can be written in by hand. */
export function openSpots(shift: TournamentVolunteerShift): number {
  const filled = shift.signups?.length ?? shift._count?.signups ?? 0;
  return shift.capacity ? Math.max(shift.capacity - filled, 0) : 0;
}
