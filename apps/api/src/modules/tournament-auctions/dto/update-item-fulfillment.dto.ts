import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateItemFulfillmentDto {
  @IsOptional()
  @IsBoolean()
  paid?: boolean;

  @IsOptional()
  @IsBoolean()
  fulfilled?: boolean;
}
