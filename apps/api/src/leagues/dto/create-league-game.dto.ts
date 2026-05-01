import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateLeagueGameDto {
  @IsString()
  @MinLength(2)
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