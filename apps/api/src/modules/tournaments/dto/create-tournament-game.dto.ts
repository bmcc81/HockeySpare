import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { TournamentGameStage } from '../../../generated/prisma/client';

export class CreateTournamentGameDto {
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

  @IsString()
  @MaxLength(120)
  homeTeamName!: string;

  @IsString()
  @MaxLength(120)
  awayTeamName!: string;

  @IsDateString()
  startsAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  arenaName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

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
