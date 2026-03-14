import { Position, SkillLevel } from './requests';

export interface TeamOffer {
  id: number;
  TeamName: string;
  position: Position;
  skillLevel: SkillLevel;
  payAmount?: number;
  arenaAddress?: string;
  arena: string;
  time: string;
  notes?: string;
}

export type CreateTeamOfferInput = Omit<TeamOffer, 'id'>;
