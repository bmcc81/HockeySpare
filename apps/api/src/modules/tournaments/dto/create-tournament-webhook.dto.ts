import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateTournamentWebhookDto {
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  secret?: string;
}
