import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MaxLength,
} from 'class-validator';
import {
  TournamentGameStage,
  TournamentGameStatus,
} from '../../../generated/prisma/client';

export class UpdateTournamentGameDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  gameNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  division?: string;

  @IsOptional()
  @IsIn(['ROUND_ROBIN', 'PLAYOFF', 'EXHIBITION', 'EVENT'])
  stage?: TournamentGameStage;

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

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  livestreamUrl?: string;
}
