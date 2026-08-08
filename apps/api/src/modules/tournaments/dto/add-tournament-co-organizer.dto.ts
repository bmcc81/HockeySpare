import { IsEmail } from 'class-validator';

export class AddTournamentCoOrganizerDto {
  @IsEmail()
  email!: string;
}
