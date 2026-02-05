import { Position, SkillLevel } from './requests';

export interface PlayerOffer {
  id: number;
  playerName: string; // <-- add this back (you had it earlier)
  position: Position;
  skillLevel: SkillLevel;
  payAmount: number;
  arena: string;
  time: string;
  notes?: string;
}

export type CreatePlayerOfferInput = Omit<PlayerOffer, 'id'>;
