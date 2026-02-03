import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { Position, RequestType, SkillLevel } from '@hockeyspare/contracts';


export class CreateRequestDto {
  @ApiProperty({ enum: RequestType })
  @IsEnum(RequestType)
  type!: RequestType;

  @ApiProperty({ enum: Position })
  @IsEnum(Position)
  position!: Position;

  @ApiProperty({ enum: SkillLevel })
  @IsEnum(SkillLevel)
  skillLevel!: SkillLevel;

  @ApiProperty({ example: 40 })
  @IsInt()
  @Min(0)
  @Max(500)
  payAmount!: number;

  @ApiProperty({ example: 'Vaudreuil Arena' })
  @IsString()
  arena!: string;

  @ApiProperty({ example: 'Tonight 8:30 PM' })
  @IsString()
  time!: string;

  @ApiProperty({ required: false, example: 'Beer league C level' })
  @IsOptional()
  @IsString()
  notes?: string;
}
