import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

export class UpdateAuctionItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  donorName?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  fairMarketValueCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  startingBidCents?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  minIncrementCents?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  buyNowCents?: number;

  @IsOptional()
  @IsISO8601()
  closesAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsIn(['OPEN', 'CANCELLED'])
  status?: 'OPEN' | 'CANCELLED';
}
