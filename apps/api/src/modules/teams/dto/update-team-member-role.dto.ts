import { IsIn } from 'class-validator';

export class UpdateTeamMemberRoleDto {
  @IsIn(['PLAYER', 'CAPTAIN'])
  role!: 'PLAYER' | 'CAPTAIN';
}
