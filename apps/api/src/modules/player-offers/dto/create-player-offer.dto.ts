import { Position, SkillLevel } from '@hockeyspare/contracts';

export class CreatePlayerOfferDto {
  playerName!: string;
  position!: Position;
  skillLevel!: SkillLevel;
  payAmount!: number;
  arena!: string;
  time!: string;
  notes?: string;
}