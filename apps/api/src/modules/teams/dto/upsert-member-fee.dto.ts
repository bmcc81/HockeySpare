import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpsertMemberFeeDto {
  @IsString()
  @MaxLength(40)
  season!: string;

  @IsInt()
  @Min(0)
  amountOwed!: number;

  @IsInt()
  @Min(0)
  amountPaid!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
