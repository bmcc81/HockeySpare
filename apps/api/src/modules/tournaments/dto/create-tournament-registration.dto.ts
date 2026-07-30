import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTournamentRegistrationDto {
  @IsString()
  @MaxLength(120)
  teamName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  division?: string;

  @IsString()
  @MaxLength(120)
  contactName!: string;

  @IsEmail()
  contactEmail!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  contactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
