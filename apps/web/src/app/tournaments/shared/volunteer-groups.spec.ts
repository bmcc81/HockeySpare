import type { TournamentVolunteerShift } from '@hockeyspare/contracts';
import { buildVolunteerGrid, groupVolunteerShifts, openSpots } from './volunteer-groups';

function shift(
  id: string,
  role: string,
  start: string,
  location: string | null,
): TournamentVolunteerShift {
  return {
    id,
    tournamentId: 't1',
    role,
    startsAt: start,
    endsAt: start,
    location,
    createdAt: '2026-11-01T00:00:00',
  };
}

describe('groupVolunteerShifts', () => {
  // Local times without a zone, so the day does not move with the test machine.
  const shifts = [
    shift('4', 'Supervisor', '2026-11-17T17:30:00', 'Île Bizard'),
    shift('1', 'Timekeeper', '2026-11-16T18:00:00', 'Île Bizard'),
    shift('2', 'Host', '2026-11-16T19:30:00', 'PFDS'),
    shift('3', 'Referees', '2026-11-16T18:00:00', 'Île Bizard'),
    shift('5', 'Helper', '2026-11-17T18:30:00', null),
  ];

  it('groups by day in date order', () => {
    const groups = groupVolunteerShifts(shifts, 'en-CA');
    expect(groups).toHaveLength(2);
    expect(groups[0].day).toContain('16');
    expect(groups[1].day).toContain('17');
  });

  it('groups each day by arena in order of first appearance', () => {
    const [monday] = groupVolunteerShifts(shifts, 'en-CA');
    expect(monday.arenas.map((a) => a.arena)).toEqual(['Île Bizard', 'PFDS']);
  });

  it('orders shifts by start time, then role', () => {
    const [monday] = groupVolunteerShifts(shifts, 'en-CA');
    expect(monday.arenas[0].shifts.map((s) => s.role)).toEqual([
      'Referees',
      'Timekeeper',
    ]);
  });

  it('keeps shifts without a location together under a null arena', () => {
    const tuesday = groupVolunteerShifts(shifts, 'en-CA')[1];
    expect(tuesday.arenas.map((a) => a.arena)).toEqual(['Île Bizard', null]);
  });

  it('returns nothing for no shifts', () => {
    expect(groupVolunteerShifts([], 'en-CA')).toEqual([]);
  });

  it('writes the day heading in the requested language', () => {
    const [monday] = groupVolunteerShifts(shifts, 'fr-CA');
    expect(monday.day.toLowerCase()).toContain('lundi');
  });
});

describe('buildVolunteerGrid', () => {
  function slot(
    id: string,
    role: string,
    start: string,
    end: string,
    location: string | null,
  ): TournamentVolunteerShift {
    return { ...shift(id, role, start, location), endsAt: end };
  }

  const shifts = [
    slot('1', 'Timekeeper', '2026-11-16T18:00:00', '2026-11-16T20:00:00', 'Île Bizard'),
    slot('2', 'Timekeeper', '2026-11-16T18:00:00', '2026-11-16T20:00:00', 'PFDS'),
    slot('3', 'Referees', '2026-11-16T18:00:00', '2026-11-16T20:00:00', 'Île Bizard'),
    slot('4', 'Host', '2026-11-16T20:00:00', '2026-11-16T22:00:00', 'PFDS'),
    slot('5', 'Helper', '2026-11-17T18:00:00', '2026-11-17T20:00:00', null),
  ];

  it('has one column per arena and one row per time slot', () => {
    const [monday, tuesday] = buildVolunteerGrid(shifts, 'en-CA');
    expect(monday.arenas).toEqual(['Île Bizard', 'PFDS']);
    expect(monday.rows).toHaveLength(2);
    expect(tuesday.arenas).toEqual([null]);
  });

  it('puts shifts with the same time on one row, in their arena column', () => {
    const [monday] = buildVolunteerGrid(shifts, 'en-CA');
    const [first, second] = monday.rows;
    expect(first.cells[0].map((s) => s.role)).toEqual(['Referees', 'Timekeeper']);
    expect(first.cells[1].map((s) => s.role)).toEqual(['Timekeeper']);
    expect(second.cells[0]).toEqual([]);
    expect(second.cells[1].map((s) => s.role)).toEqual(['Host']);
  });

  it('orders rows by start time', () => {
    const [monday] = buildVolunteerGrid(shifts, 'en-CA');
    expect(monday.rows.map((r) => r.startsAt)).toEqual([
      '2026-11-16T18:00:00',
      '2026-11-16T20:00:00',
    ]);
  });

  it('returns nothing for no shifts', () => {
    expect(buildVolunteerGrid([], 'en-CA')).toEqual([]);
  });
});

describe('openSpots', () => {
  const base = shift('1', 'Host', '2026-11-16T18:00:00', null);

  it('is the capacity minus the names already on the shift', () => {
    const named = { ...base, capacity: 3, signups: [{ id: 's', shiftId: '1', name: 'A', createdAt: '' }] };
    expect(openSpots(named)).toBe(2);
  });

  it('is zero without a capacity or when the shift is full', () => {
    expect(openSpots(base)).toBe(0);
    expect(openSpots({ ...base, capacity: 1, _count: { signups: 4 } })).toBe(0);
  });
});
