import { buildHighlights, PlayerGameLine, rankPlayers } from './rank-players';

const now = new Date('2026-09-22T16:00:00Z');
const line = (values: Partial<PlayerGameLine> = {}): PlayerGameLine => ({
  playerId: 'a',
  displayName: 'Alex',
  teamName: 'North',
  competitionName: 'Cup',
  playedAt: now,
  gamesPlayed: 1,
  goals: 1,
  assists: 2,
  ...values,
});

describe('player highlights rankings', () => {
  it('totals penalty minutes without using them to change points or ranks', () => {
    const rows = rankPlayers([
      line({ penaltyMins: 2 }),
      line({ penaltyMins: 4 }),
      line({ playerId: 'b', goals: 2, assists: 4, penaltyMins: 0 }),
    ]);
    expect(rows[0]).toMatchObject({ points: 6, penaltyMins: 6, rank: 1 });
    expect(rows[1]).toMatchObject({ points: 6, penaltyMins: 0, rank: 1 });
  });
  it('aggregates goals, assists and appearances by roster ID, not name', () => {
    const rows = rankPlayers([line(), line(), line({ playerId: 'b' })]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      playerId: 'a',
      gamesPlayed: 2,
      goals: 2,
      assists: 4,
      points: 6,
    });
  });

  it('orders by points then goals, with shared ranks and stable name ordering', () => {
    const rows = rankPlayers([
      line({ playerId: 'z', displayName: 'Zoe', goals: 2, assists: 1 }),
      line({ playerId: 'b', goals: 2, assists: 1 }),
      line(),
    ]);
    expect(rows.map((row) => [row.playerId, row.rank])).toEqual([
      ['b', 1],
      ['z', 1],
      ['a', 3],
    ]);
  });

  it('uses game dates, includes the exact seven-day boundary, and excludes future games', () => {
    const board = buildHighlights(
      [
        line({
          playerId: 'boundary',
          playedAt: new Date('2026-09-15T16:00:00Z'),
        }),
        line({
          playerId: 'old',
          playedAt: new Date('2026-09-15T15:59:59Z'),
          goals: 5,
        }),
        line({
          playerId: 'future',
          playedAt: new Date('2026-09-22T16:00:01Z'),
          goals: 20,
        }),
      ],
      'Cup',
      now,
    );
    expect(board.playersOfTheWeek.map((row) => row.playerId)).toEqual([
      'boundary',
    ]);
    expect(board.pointLeaders.map((row) => row.playerId)).toEqual([
      'old',
      'boundary',
    ]);
  });

  it('does not award a weekly spotlight for zero points or zero appearances', () => {
    const board = buildHighlights(
      [line({ gamesPlayed: 0 }), line({ playerId: 'b', goals: 0, assists: 0 })],
      'Cup',
      now,
    );
    expect(board.playersOfTheWeek).toEqual([]);
    expect(board.pointLeaders).toHaveLength(1);
  });

  it('returns empty boards without inventing players', () => {
    expect(buildHighlights([], 'Cup', now)).toMatchObject({
      pointLeaders: [],
      playersOfTheWeek: [],
    });
  });
});
