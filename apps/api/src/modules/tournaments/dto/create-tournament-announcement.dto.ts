import { IsString, MaxLength } from 'class-validator';

export class CreateTournamentAnnouncementDto {
  @IsString()
  @MaxLength(2000)
  body!: string;
}
