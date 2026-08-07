import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTournamentGameDto {
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
}
