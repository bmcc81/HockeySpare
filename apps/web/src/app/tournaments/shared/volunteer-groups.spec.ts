import type { TournamentVolunteerShift } from '@hockeyspare/contracts';
import { groupVolunteerShifts } from './volunteer-groups';

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
