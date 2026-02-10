import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { RequestType, Position, SkillLevel } from '@hockeyspare/contracts';

export class CreateRequestDto {
  @IsEnum(RequestType)
  type!: RequestType;

  @IsEnum(Position)
  position!: Position;

  @IsEnum(SkillLevel)
  skillLevel!: SkillLevel;

  @IsOptional()
  @IsInt()
  @Min(0)
  payAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  teamName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  playerName?: string;

  @IsString()
  @MaxLength(160)
  arena!: string;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  arenaAddress?: string;

  @IsString()
  @MaxLength(80)
  time!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
