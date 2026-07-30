export type LeagueRole = "PLAYER" | "TEAM_MANAGER" | "LEAGUE_MANAGER" | 'TIMEKEEPER';

export interface LeagueDto {
  id: string;
  name: string;
  season: string | null;
  createdAt: string;
  updatedAt: string;
  teams?: TeamDto[];
  members?: LeagueMemberDto[];
  arenas?: LeagueArenaDto[];
}

export interface LeagueArenaDto {
  id: string;
  leagueId: string;
  name: string;
  address?: string | null;
  createdAt?: string;
  updatedAt?: string;
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
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId?: string | null;
  displayName: string;
  email?: string | null;
  phone?: string | null;
  position?: "GOALIE" | "DEFENSE" | "FORWARD" | null;
  memberType: TeamMemberType;
  role?: TeamRole;
  notifyByApp?: boolean;
  notifyByEmail?: boolean;
  isActive?: boolean;
}

export type TeamMemberType = "REGULAR" | "SPARE";
export type TeamRole = "PLAYER" | "CAPTAIN" | "GENERAL_MANAGER";

export type TeamGameAvailabilityStatus =
  | "AVAILABLE"
  | "UNAVAILABLE"
  | "NEED_SPARE";

export interface MyMembership {
  id: string;
  role: TeamRole;
  memberType: TeamMemberType;
  position: "GOALIE" | "DEFENSE" | "FORWARD" | null;
}

export interface TeamGameInvite {
  id: string;
  status: "PENDING" | "SENT" | "CONFIRMED" | "DECLINED";
  member: TeamMember;
}

export interface TeamGameAvailability {
  id: string;
  gameId: string;
  memberId: string;
  status: TeamGameAvailabilityStatus;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  member: TeamMember;
}

export interface TeamGameArena {
  id: string;
  name: string;
  address?: string | null;
}

export interface TeamGameOpponentTeam {
  id: string;
  name: string;
}

export interface TeamGame {
  id: string;
  title: string;
  startsAt: string;
  leagueId?: string | null;
  teamId?: string;
  arenaId?: string | null;
  opponentTeamId?: string | null;

  arena?: TeamGameArena | string | null;
  opponent?: string | null;
  opponentTeam?: TeamGameOpponentTeam | null;

  notes?: string | null;
  invites: TeamGameInvite[];
  availabilities: TeamGameAvailability[];
}

export interface MyTeamResponse {
  id: string;
  name: string;
  members: TeamMember[];
  games: TeamGame[];
  myMembership?: MyMembership | null;
  canManageTeam?: boolean;
  league?: {
    id: string;
    name: string;
    season?: string | null;
  } | null;
}

export interface PlayerStat {
  id: string;
  memberId: string;
  userId?: string | null;
  teamId: string;
  leagueId?: string | null;
  season: string;
  gamesPlayed: number;
  goals: number;
  assists: number;
  penaltyMins: number;
  updatedAt: string;
  team: {
    id: string;
    name: string;
  };
  league?: {
    id: string;
    name: string;
    season?: string | null;
  } | null;
  member?: {
    id: string;
    displayName: string;
  };
}

export interface MemberFee {
  id: string;
  memberId: string;
  userId?: string | null;
  teamId: string;
  leagueId?: string | null;
  season: string;
  amountOwed: number;
  amountPaid: number;
  notes?: string | null;
  updatedAt: string;
  team: {
    id: string;
    name: string;
  };
  member?: {
    id: string;
    displayName: string;
  };
}

export type UpcomingGame = {
  id: string;
  title: string;
  startsAt: string;
  arena: TeamGameArena | string | null;
  opponent: string | null;
  opponentTeamId?: string | null;
  opponentTeam?: TeamGameOpponentTeam | null;
  notes: string | null;
  teamId?: string;
  teamName?: string;
  leagueId?: string;
  leagueName?: string;
  source: "MY_TEAM" | "LEAGUE";
  invites: any[];
  availabilities: any[];
};

export interface CreateLeagueTeamInput {
  name: string;
}

export interface TeamGameDto {
  id: string;
  teamId: string;
  leagueId?: string | null;
  arenaId?: string | null;
  opponentTeamId?: string | null;
  title: string;
  startsAt: string;
  arena: TeamGameArena | string | null;
  opponent: string | null;
  opponentTeam?: TeamGameOpponentTeam | null;
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
  opponentTeamId?: string | null;
  notes?: string | null;
}

export interface AddLeagueTeamMemberInput {
  displayName: string;
  email: string;
  phone?: string | null;
  position?: 'GOALIE' | 'DEFENSE' | 'FORWARD' | null;
  memberType: 'REGULAR' | 'SPARE';
  role?: 'PLAYER' | 'CAPTAIN' | 'GENERAL_MANAGER';
  notifyByEmail?: boolean;
  notifyBySms?: boolean;
}

export interface BulkAddLeagueTeamMembersInput {
  members: AddLeagueTeamMemberInput[];
}

export interface BulkAddLeagueTeamMembersSkippedRow {
  displayName: string;
  email: string;
  reason: string;
}

export interface BulkAddLeagueTeamMembersResult {
  created: TeamMember[];
  skipped: BulkAddLeagueTeamMembersSkippedRow[];
}
