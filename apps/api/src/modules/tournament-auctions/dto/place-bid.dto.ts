import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

export class PlaceBidDto {
  @IsString()
  @MaxLength(120)
  bidderName!: string;

  @IsEmail()
  @MaxLength(200)
  bidderEmail!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  bidderPhone?: string;

  @IsInt()
  @Min(1)
  maxAmountCents!: number;
}
