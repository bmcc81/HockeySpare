import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateTournamentTeamDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  division?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  logoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  coachName?: string;
}
