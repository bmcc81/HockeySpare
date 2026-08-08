import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateTournamentWebhookDto {
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  secret?: string;
}
