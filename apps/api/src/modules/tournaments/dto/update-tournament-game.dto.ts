import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import { TournamentGameStatus } from '../../../generated/prisma/client';

export class UpdateTournamentGameDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  homeTeamName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  awayTeamName?: string;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  arenaName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  homeScore?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  awayScore?: number;

  @IsOptional()
  @IsIn(['SCHEDULED', 'LIVE', 'FINAL'])
  status?: TournamentGameStatus;

  @IsOptional()
  @IsString()
  homeTeamId?: string;

  @IsOptional()
  @IsString()
  awayTeamId?: string;
}
