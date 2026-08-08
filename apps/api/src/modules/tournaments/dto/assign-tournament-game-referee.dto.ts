import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AssignTournamentGameRefereeDto {
  @IsString()
  refereeId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  role?: string;
}
