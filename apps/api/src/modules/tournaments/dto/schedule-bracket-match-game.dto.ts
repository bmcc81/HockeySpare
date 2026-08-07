import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class ScheduleBracketMatchGameDto {
  @IsDateString()
  startsAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  arenaName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
