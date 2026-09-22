import type { PlayerHighlight, PlayerHighlights } from '@hockeyspare/contracts';

export interface PlayerGameLine {
  playerId: string;
  photoUrl?: string | null;
  jerseyNumber?: number | null;
  displayName: string;
  teamName: string;
  competitionName: string;
  playedAt: Date;
  gamesPlayed: number;
  goals: number;
  assists: number;
  penaltyMins?: number;
}

export function rankPlayers(lines: PlayerGameLine[]): PlayerHighlight[] {
  const players = new Map<string, PlayerHighlight>();
  for (const line of lines) {
    if (line.gamesPlayed <= 0) continue;
    const row = players.get(line.playerId) ?? {
      playerId: line.playerId,
      photoUrl: line.photoUrl ?? null,
      jerseyNumber: line.jerseyNumber ?? null,
      displayName: line.displayName,
      teamName: line.teamName,
      competitionName: line.competitionName,
      gamesPlayed: 0,
      goals: 0,
      assists: 0,
      points: 0,
      penaltyMins: 0,
      rank: 0,
    };
    row.gamesPlayed += line.gamesPlayed;
    row.goals += line.goals;
    row.assists += line.assists;
    row.penaltyMins += line.penaltyMins ?? 0;
    row.points = row.goals + row.assists;
    players.set(line.playerId, row);
  }
  const rows = [...players.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.goals - a.goals ||
      a.displayName.localeCompare(b.displayName) ||
      a.playerId.localeCompare(b.playerId),
  );
  rows.forEach((row, i) => {
    const previous = rows[i - 1];
    row.rank =
      previous && previous.points === row.points && previous.goals === row.goals
        ? previous.rank
        : i + 1;
  });
  return rows;
}

export function buildHighlights(
  lines: PlayerGameLine[],
  scopeLabel: string,
  now = new Date(),
  limit = 10,
): PlayerHighlights {
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const completed = lines.filter((line) => line.playedAt <= now);
  return {
    weekStart: weekStart.toISOString(),
    asOf: now.toISOString(),
    scopeLabel,
    pointLeaders: rankPlayers(completed).slice(0, limit),
    playersOfTheWeek: rankPlayers(
      completed.filter((line) => line.playedAt >= weekStart),
    )
      .filter((row) => row.points > 0)
      .slice(0, 3),
  };
}
