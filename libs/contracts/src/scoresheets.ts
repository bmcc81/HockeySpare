export type ScoreSheetStatus = 'DRAFT' | 'FINALIZED';

export type ScoreSheetPosition = 'GOALIE' | 'DEFENSE' | 'FORWARD';

export type ScoreSheetMemberType = 'REGULAR' | 'SPARE';

export type ScoreSheetTeamRole = 'PLAYER' | 'CAPTAIN' | 'GENERAL_MANAGER';

export interface ScoreSheetUserDto {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface ScoreSheetLeagueDto {
  id: string;
  name: string;
  season?: string | null;
}

export interface ScoreSheetTeamDto {
  id: string;
  name: string;
}

export interface ScoreSheetArenaDto {
  id: string;
  name: string;
  address?: string | null;
}

export interface ScoreSheetGameDto {
  id: string;
  leagueId?: string | null;
  teamId: string;
  opponentTeamId?: string | null;
  arenaId?: string | null;
  title: string;
  startsAt: string;
  opponent?: string | null;
  notes?: string | null;
  team: ScoreSheetTeamDto;
  opponentTeam?: ScoreSheetTeamDto | null;
  arena?: ScoreSheetArenaDto | null;
  league?: ScoreSheetLeagueDto | null;
}

export interface ScoreSheetMemberDto {
  id: string;
  teamId: string;
  userId?: string | null;
  displayName: string;
  email?: string | null;
  phone?: string | null;
  position?: ScoreSheetPosition | null;
  memberType: ScoreSheetMemberType;
  role?: ScoreSheetTeamRole;
  isActive?: boolean;
  team?: ScoreSheetTeamDto;
}

export interface ScoreSheetPlayerLineDto {
  id: string;
  scoreSheetId: string;
  memberId: string;
  gamesPlayed: number;
  goals: number;
  assists: number;
  penaltyMins: number;
  createdAt: string;
  updatedAt: string;
  member: ScoreSheetMemberDto;
}

export interface GameScoreSheetDto {
  id: string | null;
  gameId: string;
  leagueId: string;
  teamId: string;

  teamScore: number;
  opponentScore: number;

  teamPeriod1Score: number;
  teamPeriod2Score: number;
  teamPeriod3Score: number;
  teamOvertimeScore: number;

  opponentPeriod1Score: number;
  opponentPeriod2Score: number;
  opponentPeriod3Score: number;
  opponentOvertimeScore: number;

  status: ScoreSheetStatus;
  finalizedAt?: string | null;
  finalizedById?: string | null;

  notes?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;

  game: ScoreSheetGameDto;
  league: ScoreSheetLeagueDto;
  team: ScoreSheetTeamDto;
  finalizedBy?: ScoreSheetUserDto | null;

  playerLines: ScoreSheetPlayerLineDto[];
}

export interface UpdateScoreSheetInput {
  teamScore?: number;
  opponentScore?: number;

  teamPeriod1Score?: number;
  teamPeriod2Score?: number;
  teamPeriod3Score?: number;
  teamOvertimeScore?: number;

  opponentPeriod1Score?: number;
  opponentPeriod2Score?: number;
  opponentPeriod3Score?: number;
  opponentOvertimeScore?: number;

  notes?: string | null;
}

export interface UpsertScoreSheetPlayerInput {
  memberId: string;
  gamesPlayed?: number;
  goals?: number;
  assists?: number;
  penaltyMins?: number;
}