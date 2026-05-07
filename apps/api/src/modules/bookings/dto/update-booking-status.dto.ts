import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateBookingStatusDto {
  @IsIn(['CONFIRMED', 'DECLINED'])
  status!: 'CONFIRMED' | 'DECLINED';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}