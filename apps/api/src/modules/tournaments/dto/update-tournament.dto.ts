import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import { TournamentRegistrationMode } from '../../../generated/prisma/client';

export class UpdateTournamentDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  /** False hides the Volunteer tab from the public (organizers can still preview). */
  @IsOptional()
  @IsBoolean()
  volunteersOpen?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  rules?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  leagueId?: string;

  @IsOptional()
  @IsEnum(TournamentRegistrationMode)
  registrationMode?: TournamentRegistrationMode;

  @IsOptional()
  @IsDateString()
  registrationDeadline?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  registrationFeeCents?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  contactPhone?: string;
}
