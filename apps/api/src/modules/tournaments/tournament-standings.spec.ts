import {
  StandingGameInput,
  StandingTeamInput,
  computeStandings,
} from './tournament-standings';

const teamsOf = (division: string, ...names: string[]): StandingTeamInput[] =>
  names.map((name) => ({ name, division }));

function game(
  home: string,
  away: string,
  homeScore: number,
  awayScore: number,
  division = 'D',
): StandingGameInput {
  return {
    homeTeamName: home,
    awayTeamName: away,
    homeScore,
    awayScore,
    final: true,
    division,
  };
}

const scheduled = (home: string, away: string, division = 'D'): StandingGameInput => ({
  homeTeamName: home,
  awayTeamName: away,
  homeScore: null,
  awayScore: null,
  final: false,
  division,
});

const order = (rows: { teamName: string }[]) => rows.map((r) => r.teamName);

describe('computeStandings', () => {
  it('awards 2 points for a win, 1 for a tie and 0 for a loss', () => {
    const rows = computeStandings(teamsOf('D', 'A', 'B', 'C'), [
      game('A', 'B', 3, 1),
      game('B', 'C', 2, 2),
    ]);
    const by = Object.fromEntries(rows.map((r) => [r.teamName, r]));

    expect(by.A).toMatchObject({ points: 2, wins: 1, gamesPlayed: 1, goalsFor: 3, goalsAgainst: 1 });
    expect(by.B).toMatchObject({ points: 1, losses: 1, ties: 1, gamesPlayed: 2 });
    expect(by.C).toMatchObject({ points: 1, ties: 1, gamesPlayed: 1 });
    // B and C are level on 1 point and drew each other, so fewest goals
    // against decides: C conceded 2, B conceded 5.
    expect(order(rows)).toEqual(['A', 'C', 'B']);
  });

  it('lists every registered team before any game is played, with no tie flags', () => {
    const rows = computeStandings(teamsOf('D', 'B', 'A', 'C'), []);

    expect(order(rows)).toEqual(['A', 'B', 'C']);
    expect(rows.every((r) => r.gamesPlayed === 0)).toBe(true);
    expect(rows.every((r) => !r.needsCommitteeDecision)).toBe(true);
  });

  it('ignores games that are not final', () => {
    const rows = computeStandings(teamsOf('D', 'A', 'B'), [
      { ...game('A', 'B', 5, 0), final: false },
    ]);

    expect(rows.every((r) => r.gamesPlayed === 0)).toBe(true);
  });

  it('breaks a two-way tie by head-to-head, even when goals against say otherwise', () => {
    // C 4, A 3, B 3, D 2. A beat B, but A has conceded more goals overall.
    const rows = computeStandings(teamsOf('D', 'A', 'B', 'C', 'D'), [
      game('A', 'B', 1, 0),
      game('C', 'A', 3, 0),
      game('A', 'D', 0, 0),
      game('B', 'C', 5, 0),
      game('B', 'D', 0, 0),
      game('C', 'D', 1, 0),
    ]);
    // Sanity: A and B really are level on points.
    expect(rows.find((r) => r.teamName === 'A')!.points).toBe(3);
    expect(rows.find((r) => r.teamName === 'B')!.points).toBe(3);

    expect(order(rows)).toEqual(['C', 'A', 'B', 'D']);
    expect(rows.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
    expect(rows.every((r) => !r.needsCommitteeDecision)).toBe(true);
  });

  it('falls back to fewest goals against when the head-to-head is a draw', () => {
    // A and B both 3 pts after drawing each other; B conceded one more.
    const rows = computeStandings(teamsOf('D', 'A', 'B', 'C'), [
      game('A', 'B', 1, 1),
      game('A', 'C', 1, 0),
      game('B', 'C', 4, 1),
    ]);

    expect(order(rows)).toEqual(['A', 'B', 'C']);
    expect(rows.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it('flags a two-way tie that no available rule separates once the division is complete', () => {
    const rows = computeStandings(teamsOf('D', 'A', 'B', 'C'), [
      game('A', 'B', 1, 1),
      game('A', 'C', 1, 0),
      game('B', 'C', 1, 0),
    ]);

    const [first, second] = rows;
    expect([first.teamName, second.teamName]).toEqual(['A', 'B']);
    expect(first.rank).toBe(1);
    expect(second.rank).toBe(1);
    expect(first.needsCommitteeDecision).toBe(true);
    expect(second.needsCommitteeDecision).toBe(true);
    expect(rows[2]).toMatchObject({ teamName: 'C', rank: 3, needsCommitteeDecision: false });
  });

  it('does not flag the same tie while games are still to be played', () => {
    const rows = computeStandings(teamsOf('D', 'A', 'B', 'C'), [
      game('A', 'B', 1, 1),
      game('A', 'C', 1, 0),
      game('B', 'C', 1, 0),
      scheduled('C', 'A'),
    ]);

    expect(rows.every((r) => !r.needsCommitteeDecision)).toBe(true);
  });

  it('breaks a three-way tie by total goals against in the round robin', () => {
    // A, B and C each end on 4 pts (each beat D). Total GA: A 3, B 1, C 2.
    const rows = computeStandings(teamsOf('D', 'A', 'B', 'C', 'D'), [
      game('A', 'B', 1, 0),
      game('B', 'C', 2, 0),
      game('C', 'A', 3, 0),
      game('A', 'D', 1, 0),
      game('B', 'D', 1, 0),
      game('C', 'D', 1, 0),
    ]);

    expect(order(rows)).toEqual(['B', 'C', 'A', 'D']);
    expect(rows.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
    expect(rows.every((r) => !r.needsCommitteeDecision)).toBe(true);
  });

  it('uses the whole round robin for a three-way tie, not just the games among the tied teams', () => {
    // Among themselves A beat B 1-0, B beat C 2-0, C beat A 3-0, which on its
    // own would rank B, C, A (GA 1, 2, 3). But B let in 8 goals against D, so
    // by total goals against (A 3, B 9, C 2) the order is C, A, B.
    const rows = computeStandings(teamsOf('D', 'A', 'B', 'C', 'D'), [
      game('A', 'B', 1, 0),
      game('B', 'C', 2, 0),
      game('C', 'A', 3, 0),
      game('A', 'D', 1, 0),
      game('B', 'D', 9, 8),
      game('C', 'D', 1, 0),
    ]);

    expect(rows.slice(0, 3).map((r) => r.points)).toEqual([4, 4, 4]);
    expect(order(rows)).toEqual(['C', 'A', 'B', 'D']);
    expect(rows.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
  });

  it('breaks a four-way tie by total goals against as well', () => {
    // Everyone beats the next team once and loses once (a ring), so all four
    // have 2 pts; total goals against then orders them.
    const rows = computeStandings(teamsOf('D', 'A', 'B', 'C', 'D'), [
      game('A', 'B', 1, 0),
      game('B', 'C', 3, 2),
      game('C', 'D', 1, 0),
      game('D', 'A', 4, 3),
    ]);

    // GA: A 0+4=4, B 1+2=3, C 3+0=3, D 1+3=4 -> B and C level (rule can't split), A and D level.
    expect(rows.map((r) => r.points)).toEqual([2, 2, 2, 2]);
    expect(rows.map((r) => r.rank)).toEqual([1, 1, 3, 3]);
    expect(order(rows)).toEqual(['B', 'C', 'A', 'D']);
    expect(rows.every((r) => r.needsCommitteeDecision)).toBe(true);
  });

  it('flags a three-way circular tie that total goals against cannot separate', () => {
    const rows = computeStandings(teamsOf('D', 'A', 'B', 'C'), [
      game('A', 'B', 1, 0),
      game('B', 'C', 1, 0),
      game('C', 'A', 1, 0),
    ]);

    expect(rows.map((r) => r.rank)).toEqual([1, 1, 1]);
    expect(rows.every((r) => r.needsCommitteeDecision)).toBe(true);
  });

  it('keeps divisions separate, each ranked from 1, in division order', () => {
    const rows = computeStandings(
      [...teamsOf('35C', 'X', 'Y'), ...teamsOf('35B', 'P', 'Q')],
      [game('Y', 'X', 2, 1, '35C'), game('P', 'Q', 4, 0, '35B')],
    );

    expect(rows.map((r) => [r.division, r.teamName, r.rank])).toEqual([
      ['35B', 'P', 1],
      ['35B', 'Q', 2],
      ['35C', 'Y', 1],
      ['35C', 'X', 2],
    ]);
  });

  it('still produces standings for free-text teams that are not registered', () => {
    const rows = computeStandings([], [{ ...game('Red', 'Blue', 2, 0), division: null }]);

    expect(order(rows)).toEqual(['Red', 'Blue']);
    expect(rows[0]).toMatchObject({ division: null, points: 2, rank: 1 });
  });
});
