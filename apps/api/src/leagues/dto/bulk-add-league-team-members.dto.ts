import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, ValidateNested } from 'class-validator';
import { AddLeagueTeamMemberDto } from './add-league-team-member.dto';

export class BulkAddLeagueTeamMembersDto {
  @ArrayMinSize(1)
  @ArrayMaxSize(300)
  @ValidateNested({ each: true })
  @Type(() => AddLeagueTeamMemberDto)
  members!: AddLeagueTeamMemberDto[];
}
