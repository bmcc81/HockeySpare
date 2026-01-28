export type RequestType = 'team_needs_player' | 'player_needs_team';

export interface SpareRequest {
  id: number;
  type: RequestType;
  position: 'goalie' | 'forward' | 'defense' | 'any';
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  payAmount: number;
  arena: string;
  time: string;
  notes?: string;
}
