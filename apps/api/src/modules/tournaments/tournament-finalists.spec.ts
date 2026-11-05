import {
  PlayoffGame,
  checkFinalists,
  finalFedBy,
  finalTeamsStillValid,
  semiFinalsFor,
  semiWinner,
} from './tournament-finalists';

function game(
  id: string,
  gameNumber: string,
  hour: number,
  home: [string, string],
  away: [string, string],
  score?: [number, number],
  status = score ? 'FINAL' : 'SCHEDULED',
): PlayoffGame {
  return {
    id,
    gameNumber,
    startsAt: new Date(Date.UTC(2026, 10, 21, hour)),
    status,
    homeTeamId: home[0] || null,
    awayTeamId: away[0] || null,
    homeTeamName: home[1],
    awayTeamName: away[1],
    homeScore: score ? score[0] : null,
    awayScore: score ? score[1] : null,
  };
}

// Semi A10: W(ROUGES) beat L(ES DADDY); semi A11: E(AGLES) beat S(TARK). Final A12 later.
const A10 = game('g10', 'A10', 18, ['W', 'WROUGES'], ['L', 'LES DADDY'], [2, 0]);
const A11 = game('g11', 'A11', 19, ['S', 'STARK'], ['E', 'EAGLES'], [0, 4]);
const A12 = game('g12', 'A12', 20, ['', 'Finalist 1 (35B)'], ['', 'Finalist 2 (35B)']);
const division = [A12, A10, A11]; // deliberately out of order

describe('semiFinalsFor / finalFedBy', () => {
  it('finds the two earlier games when the division has semi-finals + a final', () => {
    expect(semiFinalsFor(division, 'g12')!.map((g) => g.id)).toEqual(['g10', 'g11']);
  });

  it('applies no rule to a semi-final itself', () => {
    expect(semiFinalsFor(division, 'g10')).toBeNull();
  });

  it('applies no rule to a division with only a final', () => {
    expect(semiFinalsFor([A12], 'g12')).toBeNull();
  });

  it('applies no rule when the playoff shape is anything else (e.g. quarter-finals)', () => {
    const four = [A10, A11, A12, game('g13', 'A13', 17, ['', 'x'], ['', 'y'])];
    expect(semiFinalsFor(four, 'g12')).toBeNull();
  });

  it('knows which final a semi-final feeds', () => {
    expect(finalFedBy(division, 'g11')!.final.id).toBe('g12');
    expect(finalFedBy(division, 'g12')).toBeNull();
  });
});

describe('semiWinner', () => {
  it('is the team with more goals in a finished semi-final', () => {
    expect(semiWinner(A10)).toEqual({ teamId: 'W', name: 'WROUGES' });
    expect(semiWinner(A11)).toEqual({ teamId: 'E', name: 'EAGLES' });
  });

  it('is undecided until the semi-final is final', () => {
    expect(semiWinner({ ...A10, status: 'LIVE' })).toBeNull();
  });

  it('is undecided when a semi-final is tied or has no teams yet', () => {
    expect(semiWinner({ ...A10, homeScore: 1, awayScore: 1 })).toBeNull();
    expect(semiWinner(game('gx', 'A10', 18, ['', 'SEMI 1st'], ['', 'SEMI 4th'], [1, 0]))).toBeNull();
  });
});

describe('checkFinalists', () => {
  const semis: [PlayoffGame, PlayoffGame] = [A10, A11];

  it('accepts exactly the two semi-final winners, in either slot order', () => {
    expect(checkFinalists(semis, 'W', 'E')).toEqual({ ok: true });
    expect(checkFinalists(semis, 'E', 'W')).toEqual({ ok: true });
  });

  it('rejects a team that lost its semi-final, naming who may play', () => {
    const verdict = checkFinalists(semis, 'W', 'S');

    expect(verdict.ok).toBe(false);
    expect((verdict as { message: string }).message).toBe(
      "STARK lost semi-final A11, so can't play in the final. The finalists are WROUGES and EAGLES.",
    );
  });

  it('rejects a team that was not in either semi-final', () => {
    const verdict = checkFinalists(semis, 'W', 'Z');

    expect(verdict.ok).toBe(false);
    expect((verdict as { message: string }).message).toContain("didn't win a semi-final");
  });

  it('rejects the same team twice', () => {
    expect(checkFinalists(semis, 'W', 'W').ok).toBe(false);
  });

  it('does not allow the final to be set until both semi-finals are decided', () => {
    const verdict = checkFinalists([A10, { ...A11, status: 'LIVE' }], 'W', 'E');

    expect(verdict.ok).toBe(false);
    expect((verdict as { message: string }).message).toBe(
      "Finish A11 before setting the final's teams.",
    );
  });
});

describe('finalTeamsStillValid', () => {
  const semis: [PlayoffGame, PlayoffGame] = [A10, A11];

  it('is fine for blank slots', () => {
    expect(finalTeamsStillValid(semis, null, null)).toBe(true);
  });

  it('is fine for the real finalists and wrong once a semi result changes', () => {
    expect(finalTeamsStillValid(semis, 'W', 'E')).toBe(true);
    // A11 re-scored so STARK won instead of EAGLES.
    const changed: [PlayoffGame, PlayoffGame] = [A10, { ...A11, homeScore: 5, awayScore: 0 }];
    expect(finalTeamsStillValid(changed, 'W', 'E')).toBe(false);
  });

  it('is wrong with only one slot filled', () => {
    expect(finalTeamsStillValid(semis, 'W', null)).toBe(false);
  });
});
