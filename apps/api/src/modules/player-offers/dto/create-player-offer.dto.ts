import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Position, SkillLevel } from '@hockeyspare/contracts';

export class CreatePlayerOfferDto {
  @IsString()
  playerName!: string;

  @IsEnum(Position)
  position!: Position;

  @IsEnum(SkillLevel)
  skillLevel!: SkillLevel;

  @IsInt()
  @Min(0)
  payAmount!: number;

  @IsString()
  arena!: string;

  @IsString()
  arenaAddress!: string;

  @IsString()
  time!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
