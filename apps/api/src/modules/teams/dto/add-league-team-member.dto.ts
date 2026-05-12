import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class AddLeagueTeamMemberDto {
  @IsString()
  @MinLength(2)
  displayName!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsIn(['GOALIE', 'DEFENSE', 'FORWARD'])
  position?: 'GOALIE' | 'DEFENSE' | 'FORWARD' | null;

  @IsIn(['REGULAR', 'SPARE'])
  memberType!: 'REGULAR' | 'SPARE';

  @IsOptional()
  @IsIn(['PLAYER', 'CAPTAIN', 'GENERAL_MANAGER'])
  role?: 'PLAYER' | 'CAPTAIN' | 'GENERAL_MANAGER';

  @IsOptional()
  @IsBoolean()
  notifyByEmail?: boolean;
}