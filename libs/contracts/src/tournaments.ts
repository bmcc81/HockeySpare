export type TournamentGameStatus = 'SCHEDULED' | 'LIVE' | 'FINAL';

export interface TournamentGame {
  id: string;
  tournamentId: string;
  homeTeamName: string;
  awayTeamName: string;
  startsAt: string;
  arenaName?: string | null;
  notes?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  status: TournamentGameStatus;
}

export interface Tournament {
  id: string;
  name: string;
  description?: string | null;
  rules?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  leagueId?: string | null;
  createdById: string;
  games: TournamentGame[];
}

export interface CreateTournamentInput {
  name: string;
  description?: string | null;
  rules?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  leagueId?: string | null;
}

export type UpdateTournamentInput = Partial<CreateTournamentInput>;

export interface CreateTournamentGameInput {
  homeTeamName: string;
  awayTeamName: string;
  startsAt: string;
  arenaName?: string | null;
  notes?: string | null;
}

export type UpdateTournamentGameInput = Partial<CreateTournamentGameInput>;

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  teamName: string;
  division?: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface CreateTournamentRegistrationInput {
  teamName: string;
  division?: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  notes?: string | null;
}
