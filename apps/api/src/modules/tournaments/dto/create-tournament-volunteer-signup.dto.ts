import { IsEmail, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTournamentVolunteerSignupDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsEmail()
  @MaxLength(200)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  /** Language of the confirmation email; defaults to English. */
  @IsOptional()
  @IsIn(['en', 'fr'])
  lang?: 'en' | 'fr';
}
