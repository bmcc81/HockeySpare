import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpsertScoreSheetPlayerDto {
  @IsString()
  memberId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  gamesPlayed?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  goals?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  assists?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  penaltyMins?: number;
}