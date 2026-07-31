import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { PaymentsWebhookController } from './payments-webhook.controller';
import { EmailModule } from '../email/email.module';
import { SmsModule } from '../sms/sms.module';
import { RequestsModule } from '../requests/requests.module';
import { StripeModule } from '../stripe/stripe.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    EmailModule,
    SmsModule,
    RequestsModule,
    StripeModule,
  ],
  controllers: [TeamsController, PaymentsWebhookController],
  providers: [TeamsService],
})
export class TeamsModule {}
