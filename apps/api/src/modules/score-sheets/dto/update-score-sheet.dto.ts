import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateScoreSheetDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  teamScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  opponentScore?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}