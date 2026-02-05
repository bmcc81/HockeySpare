import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, IsNotEmpty, Max, Min, ValidateIf } from 'class-validator';

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

  @ApiPropertyOptional({ example: 'Conor McDavid', description: 'Required when type=player_needs_team' })
  @ValidateIf(o => o.type === RequestType.PLAYER_NEEDS_TEAM)
  @IsString()
  @IsNotEmpty()
  playerName?: string;

  @ApiPropertyOptional({ example: 'Vaudreuil Beer League', description: 'Required when type=team_needs_player' })
  @ValidateIf(o => o.type === RequestType.TEAM_NEEDS_PLAYER)
  @IsString()
  @IsNotEmpty()
  teamName?: string;

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
