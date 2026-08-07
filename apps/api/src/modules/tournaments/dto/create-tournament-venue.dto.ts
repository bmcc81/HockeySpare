import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTournamentVenueDto {
  @IsString()
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  parkingInfo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  dressingRoomInfo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  concessionsInfo?: string;
}
