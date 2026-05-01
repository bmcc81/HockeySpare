export type LeagueRole = 'PLAYER' | 'TEAM_MANAGER' | 'LEAGUE_MANAGER';

export interface LeagueDto {
  id: string;
  name: string;
  season: string | null;
  createdAt: string;
  updatedAt: string;
  teams?: TeamDto[];
  members?: LeagueMemberDto[];
}

export interface LeagueMemberDto {
  id: string;
  leagueId: string;
  userId: string;
  role: LeagueRole;
  createdAt: string;
}

export interface CreateLeagueInput {
  name: string;
  season?: string | null;
}

export interface TeamDto {
  id: string;
  name: string;
  createdById: string | null;
  leagueId: string | null;
  createdAt: string;
  updatedAt: string;
  games?: TeamGameDto[];
}

export interface CreateLeagueTeamInput {
  name: string;
}

export interface TeamGameDto {
  id: string;
  teamId: string;
  title: string;
  startsAt: string;
  arena: string | null;
  opponent: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  team?: TeamDto;
}

export interface CreateLeagueGameInput {
  title: string;
  startsAt: string;
  arena?: string | null;
  opponent?: string | null;
  notes?: string | null;
}