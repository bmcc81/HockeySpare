import { IsInt, IsString, MaxLength, Min } from 'class-validator';

export class UpsertPlayerStatDto {
  @IsString()
  @MaxLength(40)
  season!: string;

  @IsInt()
  @Min(0)
  gamesPlayed!: number;

  @IsInt()
  @Min(0)
  goals!: number;

  @IsInt()
  @Min(0)
  assists!: number;

  @IsInt()
  @Min(0)
  penaltyMins!: number;
}