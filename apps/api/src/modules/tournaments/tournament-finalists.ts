/**
 * Who may play a division's final.
 *
 * Convention (matches how the PFDS schedule is built): within one division,
 * when there are exactly three playoff games, the last one is the final and
 * the two before it are the semi-finals. In that shape the finalists are
 * exactly the two semi-final winners - nobody else can be put in the final,
 * and nobody who lost their semi can reach it.
 *
 * Divisions with a different playoff shape (just a final, quarter-finals,
 * ...) have no unambiguous feeder games, so no rule is applied to them.
 */

export interface PlayoffGame {
  id: string;
  gameNumber: string | null;
  startsAt: Date;
  status: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
}

export interface SemiWinner {
  teamId: string;
  name: string;
}

export type FinalistVerdict = { ok: true } | { ok: false; message: string };

const label = (game: PlayoffGame): string => game.gameNumber ?? 'the semi-final';

function chronological(a: PlayoffGame, b: PlayoffGame): number {
  return (
    a.startsAt.getTime() - b.startsAt.getTime() ||
    (a.gameNumber ?? '').localeCompare(b.gameNumber ?? '')
  );
}

/** The two semi-finals feeding `finalId`, or null if the division isn't shaped that way. */
export function semiFinalsFor(
  divisionPlayoffs: PlayoffGame[],
  finalId: string,
): [PlayoffGame, PlayoffGame] | null {
  if (divisionPlayoffs.length !== 3) {
    return null;
  }

  const sorted = [...divisionPlayoffs].sort(chronological);

  return sorted[2].id === finalId ? [sorted[0], sorted[1]] : null;
}

/** The final that the given game feeds into, or null if it isn't a semi-final. */
export function finalFedBy(
  divisionPlayoffs: PlayoffGame[],
  gameId: string,
): { final: PlayoffGame; semis: [PlayoffGame, PlayoffGame] } | null {
  if (divisionPlayoffs.length !== 3) {
    return null;
  }

  const sorted = [...divisionPlayoffs].sort(chronological);

  return sorted[0].id === gameId || sorted[1].id === gameId
    ? { final: sorted[2], semis: [sorted[0], sorted[1]] }
    : null;
}

/** The winner of a finished semi-final, or null while it is undecided. */
export function semiWinner(semi: PlayoffGame): SemiWinner | null {
  if (
    semi.status !== 'FINAL' ||
    semi.homeScore == null ||
    semi.awayScore == null ||
    semi.homeScore === semi.awayScore ||
    !semi.homeTeamId ||
    !semi.awayTeamId
  ) {
    return null;
  }

  return semi.homeScore > semi.awayScore
    ? { teamId: semi.homeTeamId, name: semi.homeTeamName }
    : { teamId: semi.awayTeamId, name: semi.awayTeamName };
}

function nameOf(teamId: string, semis: PlayoffGame[]): string {
  for (const semi of semis) {
    if (semi.homeTeamId === teamId) return semi.homeTeamName;
    if (semi.awayTeamId === teamId) return semi.awayTeamName;
  }

  return 'That team';
}

/** Are these two teams exactly the two semi-final winners? */
export function checkFinalists(
  semis: [PlayoffGame, PlayoffGame],
  homeTeamId: string,
  awayTeamId: string,
): FinalistVerdict {
  if (homeTeamId === awayTeamId) {
    return { ok: false, message: 'Choose two different teams for the final.' };
  }

  const winners = semis.map(semiWinner);

  if (winners.some((w) => w === null)) {
    const pending = semis
      .filter((_, i) => winners[i] === null)
      .map(label)
      .join(' and ');

    return {
      ok: false,
      message: `Finish ${pending} before setting the final's teams.`,
    };
  }

  const [first, second] = winners as [SemiWinner, SemiWinner];
  const allowed = new Set([first.teamId, second.teamId]);

  for (const teamId of [homeTeamId, awayTeamId]) {
    if (!allowed.has(teamId)) {
      const lostSemi = semis.find(
        (s) => s.homeTeamId === teamId || s.awayTeamId === teamId,
      );
      const who = nameOf(teamId, semis);

      return {
        ok: false,
        message:
          (lostSemi
            ? `${who} lost semi-final ${label(lostSemi)}, so can't play in the final.`
            : `${who} didn't win a semi-final, so can't play in the final.`) +
          ` The finalists are ${first.name} and ${second.name}.`,
      };
    }
  }

  return { ok: true };
}

/**
 * Would these two final slots still be correct if the semi-finals were as
 * given? Blank slots are always fine.
 */
export function finalTeamsStillValid(
  semis: [PlayoffGame, PlayoffGame],
  homeTeamId: string | null,
  awayTeamId: string | null,
): boolean {
  if (!homeTeamId && !awayTeamId) {
    return true;
  }

  if (!homeTeamId || !awayTeamId) {
    return false;
  }

  return checkFinalists(semis, homeTeamId, awayTeamId).ok;
}
