import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateLeagueDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  season?: string;
}