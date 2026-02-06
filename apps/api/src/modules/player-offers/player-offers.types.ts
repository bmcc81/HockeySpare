import { Position, SkillLevel } from '@hockeyspare/contracts';

export type PlayerOffer = {
  id: number;
  position: Position;
  skillLevel: SkillLevel;
  payAmount: number;
  playerName: string;
  arena: string;
  arenaAddress?: string;
  time: string;
  notes?: string;
};
