import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

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
}
