import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateTournamentLostFoundItemDto {
  @IsString()
  @MaxLength(500)
  description!: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  contactInfo?: string;
}
