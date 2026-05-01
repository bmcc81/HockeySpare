import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateMyTeamDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;
}