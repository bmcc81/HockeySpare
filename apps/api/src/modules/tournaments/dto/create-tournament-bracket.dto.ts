import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTournamentBracketDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  division?: string;

  /** Team IDs in seed order (first = top seed). */
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  teamIds!: string[];
}
