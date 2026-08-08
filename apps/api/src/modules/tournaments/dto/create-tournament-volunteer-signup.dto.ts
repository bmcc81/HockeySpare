import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

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
}
