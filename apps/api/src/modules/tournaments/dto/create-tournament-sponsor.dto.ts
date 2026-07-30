import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateTournamentSponsorDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  logoUrl?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  linkUrl?: string;
}
