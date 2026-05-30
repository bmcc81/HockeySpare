import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GenerateSpareMessageDto {
  @IsString()
  position!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  playersNeeded!: number;

  @IsString()
  date!: string;

  @IsString()
  time!: string;

  @IsString()
  arena!: string;

  @IsString()
  location!: string;

  @IsString()
  skillLevel!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}