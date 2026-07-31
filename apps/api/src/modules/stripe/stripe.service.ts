import { Injectable, InternalServerErrorException } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private client: Stripe | null = null;

  getClient(): Stripe {
    if (this.client) {
      return this.client;
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      throw new InternalServerErrorException(
        'Payments are not configured. Set STRIPE_SECRET_KEY to enable Stripe.',
      );
    }

    this.client = new Stripe(secretKey);

    return this.client;
  }

  isConfigured(): boolean {
    return !!process.env.STRIPE_SECRET_KEY;
  }
}
