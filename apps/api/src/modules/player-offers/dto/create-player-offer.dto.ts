import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Position, SkillLevel } from '@hockeyspare/contracts';

export class CreatePlayerOfferDto {
  @IsString()
  playerName!: string;

  @IsEnum(Position)
  position!: Position;

  @IsEnum(SkillLevel)
  skillLevel!: SkillLevel;

  @IsOptional()
  @IsInt()
  @Min(0)
  payAmount?: number | null;

  @IsString()
  arena!: string;

  @IsOptional()
  @IsString()
  arenaAddress?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsDateString()
  date!: string;

  @IsString()
  time!: string;
}