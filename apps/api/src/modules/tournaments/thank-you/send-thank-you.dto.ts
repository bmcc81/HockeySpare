import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SendThankYouDto {
  /** A personal line from the organizers, shown at the top of the email. */
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
