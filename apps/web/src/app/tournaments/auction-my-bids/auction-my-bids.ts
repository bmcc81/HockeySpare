import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MyBidsView } from '@hockeyspare/contracts';
import { AuctionApiService } from '../../core/services/auction-api.service';

@Component({
  selector: 'app-auction-my-bids',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './auction-my-bids.html',
})
export class AuctionMyBidsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(AuctionApiService);

  tournamentId = this.route.snapshot.paramMap.get('id') ?? '';
  token = this.route.snapshot.queryParamMap.get('token') ?? '';

  view = signal<MyBidsView | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  payRedirecting = signal(false);
  payError = signal<string | null>(null);

  verifying = signal(false);
  paymentMessage = signal<string | null>(null);
  paymentIsError = signal(false);

  ngOnInit(): void {
    if (!this.token) {
      this.error.set('This link is missing its access token.');
      this.loading.set(false);
      return;
    }

    this.load();

    const sessionId = this.route.snapshot.queryParamMap.get('paymentSessionId');
    if (sessionId) {
      this.verifyPayment(sessionId);
    }
  }

  private load(): void {
    this.api.getMyBids(this.tournamentId, this.token).subscribe({
      next: (v) => {
        this.view.set(v);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'This link is invalid or expired.');
        this.loading.set(false);
      },
    });
  }

  private verifyPayment(sessionId: string): void {
    this.verifying.set(true);
    this.api.verifyCheckout(this.tournamentId, sessionId).subscribe({
      next: (result) => {
        this.verifying.set(false);
        if (result.status === 'SUCCEEDED') {
          this.paymentIsError.set(false);
          this.paymentMessage.set(
            `Payment received for ${result.paidItemNames.join(', ')}. Thank you!`,
          );
          this.load();
        } else {
          this.paymentIsError.set(true);
          this.paymentMessage.set('Your payment has not completed yet.');
        }
      },
      error: () => {
        this.verifying.set(false);
        this.paymentIsError.set(true);
        this.paymentMessage.set('Could not confirm this payment.');
      },
    });
  }

  pay(): void {
    this.payRedirecting.set(true);
    this.payError.set(null);
    this.api.startCheckout(this.tournamentId, this.token).subscribe({
      next: (result) => {
        window.location.href = result.checkoutUrl;
      },
      error: (err) => {
        this.payRedirecting.set(false);
        this.payError.set(err?.error?.message || 'Could not start checkout.');
      },
    });
  }
}
