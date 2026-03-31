export enum RequestType {
  TEAM_NEEDS_PLAYER = 'team_needs_player',
  PLAYER_NEEDS_TEAM = 'player_needs_team',
}

export enum Position {
  GOALIE = 'GOALIE',
  DEFENSE = 'DEFENSE',
  FORWARD = 'FORWARD',
}

export enum SkillLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  ELITE = 'ELITE',
}

export enum RequestStatus {
  OPEN = 'OPEN',
  FILLED = 'FILLED',
  CANCELLED = 'CANCELLED',
}

export interface BaseRequest {
  id: number;
  type: RequestType;
  position: Position;
  skillLevel: SkillLevel;
  payAmount: number | null;
  arena: string;
  arenaAddress: string | null;
  time: string;
  status: RequestStatus;
  notes: string | null;
}

export type PlayerNeedsTeamRequest = BaseRequest & {
  type: RequestType.PLAYER_NEEDS_TEAM;
  playerName: string | null;
  teamName: null;
};

export type TeamNeedsPlayerRequest = BaseRequest & {
  type: RequestType.TEAM_NEEDS_PLAYER;
  teamName: string | null;
  playerName: string;
};

export type SpareRequest = PlayerNeedsTeamRequest | TeamNeedsPlayerRequest;

export type CreatePlayerNeedsTeamInput = Omit<
  PlayerNeedsTeamRequest,
  'id' | 'status'
>;

export type CreateTeamNeedsPlayerInput = Omit<
  TeamNeedsPlayerRequest,
  'id' | 'status'
>;

export type CreateRequestInput =
  | CreatePlayerNeedsTeamInput
  | CreateTeamNeedsPlayerInput;

  