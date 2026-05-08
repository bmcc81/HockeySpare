import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateLeagueArenaDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;
}