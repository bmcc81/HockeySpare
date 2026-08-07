import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Position } from '../../../generated/prisma/client';

export class CreateTournamentTeamPlayerDto {
  @IsString()
  @MaxLength(120)
  displayName!: string;

  @IsOptional()
  @IsEnum(Position)
  position?: Position;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999)
  jerseyNumber?: number;
}
