import { IsEmail, IsIn, IsOptional, MaxLength } from 'class-validator';

export class FollowTeamDto {
  @IsEmail()
  @MaxLength(200)
  email!: string;

  /** Language for the emails. */
  @IsOptional()
  @IsIn(['en', 'fr'])
  lang?: 'en' | 'fr';
}
