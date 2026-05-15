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
  @Type(() => Number)
  @IsInt()
  @Min(0)
  teamPeriod1Score?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  teamPeriod2Score?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  teamPeriod3Score?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  teamOvertimeScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  opponentPeriod1Score?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  opponentPeriod2Score?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  opponentPeriod3Score?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  opponentOvertimeScore?: number;

  @IsOptional()
  @IsString()
  notes?: string | null;
}