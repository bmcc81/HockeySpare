import { IsString, MinLength } from 'class-validator';

export class CreateLeagueTeamDto {
  @IsString()
  @MinLength(2)
  name!: string;
}
