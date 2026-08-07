import { IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { TournamentSponsorTier } from '../../../generated/prisma/client';

export class UpdateTournamentSponsorDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  logoUrl?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  linkUrl?: string;

  @IsOptional()
  @IsEnum(TournamentSponsorTier)
  tier?: TournamentSponsorTier;
}
