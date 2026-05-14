import { IsIn } from 'class-validator';

export class UpdateLeagueTeamMemberRoleDto {
  @IsIn(['PLAYER', 'CAPTAIN', 'GENERAL_MANAGER'])
  role!: 'PLAYER' | 'CAPTAIN' | 'GENERAL_MANAGER';
}