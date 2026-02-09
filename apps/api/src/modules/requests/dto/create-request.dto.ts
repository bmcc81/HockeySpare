import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateRequestDto {
  @IsIn(['team_needs_player', 'player_needs_team'])
  type!: 'team_needs_player' | 'player_needs_team';

  @IsIn(['goalie', 'defense', 'forward'])
  position!: 'goalie' | 'defense' | 'forward';

  @IsIn(['beginner', 'intermediate', 'advanced', 'elite'])
  skillLevel!: 'beginner' | 'intermediate' | 'advanced' | 'elite';

  @IsOptional()
  @IsInt()
  @Min(0)
  payAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  teamName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  playerName?: string;

  @IsString()
  @MaxLength(160)
  arena!: string;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  arenaAddress?: string;

  @IsString()
  @MaxLength(80)
  time!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
