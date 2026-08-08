import { IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { TournamentInfoListingCategory } from '../../../generated/prisma/client';

export class CreateTournamentInfoListingDto {
  @IsEnum(TournamentInfoListingCategory)
  category!: TournamentInfoListingCategory;

  @IsString()
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  url?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  imageUrl?: string;
}
