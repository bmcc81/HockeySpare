import { PlayerHighlightsModule } from '../modules/player-highlights/player-highlights.module';
import { Module } from '@nestjs/common';
import { LeaguesController } from './leagues.controller';
import { LeaguesService } from './leagues.service';
import { EmailModule } from '../modules/email/email.module';

@Module({
  controllers: [LeaguesController],
  providers: [LeaguesService],
  imports: [EmailModule, PlayerHighlightsModule],
})
export class LeaguesModule {}
