import { IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { TournamentLostFoundStatus } from '../../../generated/prisma/client';

export class UpdateTournamentLostFoundItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  contactInfo?: string;

  @IsOptional()
  @IsEnum(TournamentLostFoundStatus)
  status?: TournamentLostFoundStatus;
}
