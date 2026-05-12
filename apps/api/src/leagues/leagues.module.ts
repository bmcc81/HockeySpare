import { Module } from '@nestjs/common';
import { LeaguesController } from './leagues.controller';
import { LeaguesService } from './leagues.service';
import { EmailModule } from '../modules/email/email.module';

@Module({
  controllers: [LeaguesController],
  providers: [LeaguesService],
  imports: [EmailModule],
})
export class LeaguesModule {}