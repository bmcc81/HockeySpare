import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpsertTournamentGamePlayerStatDto {
  @IsString()
  teamPlayerId!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  goals?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  assists?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  penaltyMins?: number;

  @IsOptional()
  @IsInt()
  plusMinus?: number;
}
