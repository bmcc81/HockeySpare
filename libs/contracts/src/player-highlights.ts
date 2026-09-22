export interface PlayerHighlight {
  playerId: string;
  photoUrl?: string | null;
  jerseyNumber?: number | null;
  displayName: string;
  teamName: string;
  competitionName: string;
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
  penaltyMins: number;
  rank: number;
}

export interface PlayerHighlights {
  weekStart: string;
  asOf: string;
  scopeLabel: string;
  playersOfTheWeek: PlayerHighlight[];
  pointLeaders: PlayerHighlight[];
}
