import { Position, SkillLevel, RequestStatus } from './requests';

export interface PlayerOffer {
  id: number;
  playerName: string;
  position: Position;
  skillLevel: SkillLevel;
  payAmount: number;
  arenaAddress?: string;
  arena: string;
  date: string;
  time: string;
  status: RequestStatus;
  notes?: string;
}

export type CreatePlayerOfferInput = Omit<PlayerOffer, 'id' | 'status'>;
