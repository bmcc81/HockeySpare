import { IsEnum } from 'class-validator';
import { TournamentRegistrationStatus } from '../../../generated/prisma/client';

export class UpdateTournamentRegistrationDto {
  @IsEnum(TournamentRegistrationStatus)
  status!: TournamentRegistrationStatus;
}
