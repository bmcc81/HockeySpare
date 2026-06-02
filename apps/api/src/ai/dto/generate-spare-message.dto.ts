import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class GenerateSpareMessageDto {
  @IsString()
  @MaxLength(80)
  teamName!: string;

  @IsString()
  @MaxLength(50)
  position!: string;

  @IsInt()
  @Min(1)
  @Max(10)
  playersNeeded!: number;

  @IsString()
  @MaxLength(50)
  date!: string;

  @IsString()
  @MaxLength(50)
  time!: string;

  @IsString()
  @MaxLength(100)
  arena!: string;

  @IsString()
  @MaxLength(220)
  location!: string;

  @IsString()
  @MaxLength(50)
  skillLevel!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}