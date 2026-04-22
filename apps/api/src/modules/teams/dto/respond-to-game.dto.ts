import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TeamGameAvailabilityStatus } from '../../../generated/prisma/client';

export class RespondToGameDto {
  @IsEnum(TeamGameAvailabilityStatus)
  status!: TeamGameAvailabilityStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}