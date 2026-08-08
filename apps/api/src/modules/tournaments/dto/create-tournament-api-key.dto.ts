import { IsString, MaxLength } from 'class-validator';

export class CreateTournamentApiKeyDto {
  @IsString()
  @MaxLength(120)
  label!: string;
}
