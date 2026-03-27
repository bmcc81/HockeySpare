import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBookingDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}