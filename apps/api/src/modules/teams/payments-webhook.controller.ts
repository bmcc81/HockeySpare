import {
  BadRequestException,
  Controller,
  Headers,
  NotImplementedException,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { TeamsService } from './teams.service';
import { StripeService } from '../stripe/stripe.service';
import { TournamentsService } from '../tournaments/tournaments.service';

@Controller('payments')
export class PaymentsWebhookController {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly tournamentsService: TournamentsService,
    private readonly stripeService: StripeService,
  ) {}

  @Post('webhook')
  async handleWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('stripe-signature') signature: string,
  ) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new NotImplementedException('Stripe webhooks are not configured.');
    }

    if (!signature || !req.rawBody) {
      throw new BadRequestException('Missing Stripe signature or body.');
    }

    const event = this.stripeService
      .getClient()
      .webhooks.constructEvent(req.rawBody, signature, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      if (session.metadata?.type === 'tournament_registration') {
        await this.tournamentsService.handleTournamentCheckoutSessionCompleted(
          session,
        );
      } else {
        await this.teamsService.handleStripeCheckoutSessionCompleted(session);
      }
    }

    return { received: true };
  }
}
