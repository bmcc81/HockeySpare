import { IsString, MaxLength } from 'class-validator';

export class AskHelpDto {
  @IsString()
  @MaxLength(500)
  question!: string;
}