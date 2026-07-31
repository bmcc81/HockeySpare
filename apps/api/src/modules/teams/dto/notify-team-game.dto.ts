import { IsArray, IsOptional, IsString } from 'class-validator';

export class NotifyTeamGameDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[];
}
