import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTournamentRefereeDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;
}
