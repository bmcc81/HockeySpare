import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateTeamGameDto {
  @IsString()
  title!: string;

  @IsDateString()
  startsAt!: string;

  @IsOptional()
  @IsString()
  arena?: string;

  @IsOptional()
  @IsString()
  opponent?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
