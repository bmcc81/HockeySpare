import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TournamentAnnouncementType } from '../../../generated/prisma/client';

export class CreateTournamentAnnouncementDto {
  @IsString()
  @MaxLength(2000)
  body!: string;

  @IsOptional()
  @IsEnum(TournamentAnnouncementType)
  type?: TournamentAnnouncementType;
}
