import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { Position, TeamMemberType } from '../../../generated/prisma/client';

export class CreateTeamMemberDto {
  @IsString()
  displayName!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(Position)
  position?: Position;

  @IsEnum(TeamMemberType)
  memberType!: TeamMemberType;

  @IsOptional()
  @IsBoolean()
  notifyByApp?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyByEmail?: boolean;
}