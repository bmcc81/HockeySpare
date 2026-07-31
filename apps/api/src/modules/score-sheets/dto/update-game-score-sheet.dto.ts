import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateGameScoreSheetDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  teamScore?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  opponentScore?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
