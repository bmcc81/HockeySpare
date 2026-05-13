import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { EmailModule } from '../email/email.module';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [PrismaModule, NotificationsModule, EmailModule, SmsModule],
  controllers: [TeamsController],
  providers: [TeamsService],
})
export class TeamsModule {}

