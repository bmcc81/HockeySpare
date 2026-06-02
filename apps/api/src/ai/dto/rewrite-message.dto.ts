import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class RewriteMessageDto {
  @IsString()
  @MaxLength(1000)
  message!: string;

  @IsOptional()
  @IsIn(['friendly', 'professional', 'short', 'urgent'])
  tone?: 'friendly' | 'professional' | 'short' | 'urgent';

  @IsOptional()
  @IsIn(['en', 'fr'])
  language?: 'en' | 'fr';
}