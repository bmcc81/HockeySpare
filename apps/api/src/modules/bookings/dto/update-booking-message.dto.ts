import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateBookingMessageDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}