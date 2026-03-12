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

export interface BaseRequest {
  id: number;
  type: RequestType;
  position: Position;
  skillLevel: SkillLevel;
  payAmount: number;
  arena: string;
  arenaAddress?: string;
  time: string;
  notes?: string;
}

export type PlayerNeedsTeamRequest = BaseRequest & {
  type: RequestType.PLAYER_NEEDS_TEAM;
  playerName: string;
};

export type TeamNeedsPlayerRequest = BaseRequest & {
  type: RequestType.TEAM_NEEDS_PLAYER;
  teamName: string;
  playerName?: string; 
};

export type SpareRequest = PlayerNeedsTeamRequest | TeamNeedsPlayerRequest;

export type CreateRequestInput =
  | Omit<PlayerNeedsTeamRequest, 'id'>
  | Omit<TeamNeedsPlayerRequest, 'id'>;
