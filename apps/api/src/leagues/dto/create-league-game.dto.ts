import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateLeagueGameDto {
  @IsString()
  title!: string;

  @IsDateString()
  startsAt!: string;

  @IsOptional()
  @IsString()
  arena?: string;

  @IsOptional()
  @IsString()
  opponent?: string;

  @IsOptional()
  @IsString()
  opponentTeamId?: string | null;

  @IsOptional()
  @IsString()
  notes?: string;
}