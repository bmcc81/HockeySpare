/**
 * Round-robin standings for a tournament, following the PFDS Oldtimers
 * rules (section 10, "Methods Used in Declaring Standings and Winners"):
 *
 *  - 2 points for a win, 1 for a tie, 0 for a loss.
 *  - Two teams level on points: the head-to-head result in the round robin
 *    decides; if that doesn't separate them, the team that allowed the fewest
 *    goals in the round robin ranks higher.
 *  - Three or four teams level: the goals against *among those teams* decide.
 *  - Anything still level after that is decided by the earliest goal scored,
 *    then (four teams) a coin flip. The site doesn't record goal times, so
 *    those cases are flagged for the tournament committee instead of guessed.
 *
 * Standings are always per division: a tie only means something between
 * teams that are competing for the same places.
 */

export interface StandingTeamInput {
  name: string;
  division: string | null;
}

export interface StandingGameInput {
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  /** True once the game is marked final with both scores recorded. */
  final: boolean;
  division: string | null;
}

export interface ComputedStandingRow {
  teamName: string;
  division: string | null;
  gamesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifferential: number;
  points: number;
  /** 1-based place within the division; teams still level share a place. */
  rank: number;
  /**
   * Still level after every rule the site can apply, in a division whose
   * round robin is complete: the committee has to decide (earliest goal / coin
   * flip). Never set mid-tournament, when ties are normal.
   */
  needsCommitteeDecision: boolean;
}

type Row = Omit<ComputedStandingRow, 'rank' | 'needsCommitteeDecision'>;
type FinalGame = {
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
};

function emptyRow(teamName: string, division: string | null): Row {
  return {
    teamName,
    division,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifferential: 0,
    points: 0,
  };
}

function credit(row: Row, goalsFor: number, goalsAgainst: number): void {
  row.gamesPlayed += 1;
  row.goalsFor += goalsFor;
  row.goalsAgainst += goalsAgainst;
  row.goalDifferential = row.goalsFor - row.goalsAgainst;

  if (goalsFor > goalsAgainst) {
    row.wins += 1;
    row.points += 2;
  } else if (goalsFor < goalsAgainst) {
    row.losses += 1;
  } else {
    row.ties += 1;
    row.points += 1;
  }
}

/** Groups items that compare equal under `key`, in ascending key order. */
function groupBy<T>(items: T[], key: (item: T) => number): T[][] {
  const sorted = [...items].sort((a, b) => key(a) - key(b));
  const groups: T[][] = [];

  for (const item of sorted) {
    const last = groups[groups.length - 1];

    if (last && key(last[0]) === key(item)) {
      last.push(item);
    } else {
      groups.push([item]);
    }
  }

  return groups;
}

/**
 * Splits teams that are level on points into ordered sub-groups. Each
 * sub-group of one team is a settled place; a larger sub-group is still tied.
 */
function breakTie(tied: Row[], games: FinalGame[]): Row[][] {
  if (tied.length === 1) {
    return [tied];
  }

  const names = new Set(tied.map((row) => row.teamName));
  const among = games.filter((g) => names.has(g.home) && names.has(g.away));

  if (tied.length === 2) {
    const [a, b] = tied;
    let aWins = 0;
    let bWins = 0;

    for (const game of among) {
      const winner =
        game.homeScore === game.awayScore
          ? null
          : game.homeScore > game.awayScore
            ? game.home
            : game.away;

      if (winner === a.teamName) aWins += 1;
      if (winner === b.teamName) bWins += 1;
    }

    if (aWins !== bWins) {
      return aWins > bWins ? [[a], [b]] : [[b], [a]];
    }

    if (a.goalsAgainst !== b.goalsAgainst) {
      return a.goalsAgainst < b.goalsAgainst ? [[a], [b]] : [[b], [a]];
    }

    return [[a, b]];
  }

  // Three or more: goals against in the games played among these teams.
  const goalsAgainstAmong = (row: Row): number =>
    among.reduce((total, g) => {
      if (g.home === row.teamName) return total + g.awayScore;
      if (g.away === row.teamName) return total + g.homeScore;
      return total;
    }, 0);

  return groupBy(tied, goalsAgainstAmong);
}

function compareDivision(a: string | null, b: string | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a.localeCompare(b);
}

export function computeStandings(
  teams: StandingTeamInput[],
  games: StandingGameInput[],
): ComputedStandingRow[] {
  const divisionByTeam = new Map(teams.map((t) => [t.name, t.division]));

  const gameDivision = (g: StandingGameInput): string | null =>
    g.division ??
    divisionByTeam.get(g.homeTeamName) ??
    divisionByTeam.get(g.awayTeamName) ??
    null;

  // Division -> its rows (every registered team, even with no games yet).
  const rowsByDivision = new Map<string | null, Map<string, Row>>();

  const rowFor = (division: string | null, name: string): Row => {
    let rows = rowsByDivision.get(division);

    if (!rows) {
      rows = new Map();
      rowsByDivision.set(division, rows);
    }

    let row = rows.get(name);

    if (!row) {
      row = emptyRow(name, division);
      rows.set(name, row);
    }

    return row;
  };

  for (const team of teams) {
    rowFor(team.division, team.name);
  }

  const finalByDivision = new Map<string | null, FinalGame[]>();
  const countByDivision = new Map<string | null, { all: number; final: number }>();

  for (const game of games) {
    const division = gameDivision(game);
    const count = countByDivision.get(division) ?? { all: 0, final: 0 };
    count.all += 1;

    if (game.final && game.homeScore != null && game.awayScore != null) {
      count.final += 1;
      credit(rowFor(division, game.homeTeamName), game.homeScore, game.awayScore);
      credit(rowFor(division, game.awayTeamName), game.awayScore, game.homeScore);

      const list = finalByDivision.get(division) ?? [];
      list.push({
        home: game.homeTeamName,
        away: game.awayTeamName,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
      });
      finalByDivision.set(division, list);
    }

    countByDivision.set(division, count);
  }

  const result: ComputedStandingRow[] = [];

  const divisions = [...rowsByDivision.keys()].sort(compareDivision);

  for (const division of divisions) {
    const rows = [...(rowsByDivision.get(division) ?? new Map()).values()];
    const finals = finalByDivision.get(division) ?? [];
    const count = countByDivision.get(division);
    const complete = !!count && count.all > 0 && count.final === count.all;

    // Order by points, then settle each level group with the tie-break rules.
    const levelGroups = groupBy(rows, (row) => -row.points);
    let place = 0;

    for (const level of levelGroups) {
      for (const subGroup of breakTie(level, finals)) {
        const stillTied = subGroup.length > 1;
        const ordered = [...subGroup].sort((a, b) =>
          a.teamName.localeCompare(b.teamName),
        );

        for (const row of ordered) {
          result.push({
            ...row,
            rank: place + 1,
            needsCommitteeDecision: stillTied && complete,
          });
        }

        place += subGroup.length;
      }
    }
  }

  return result;
}
