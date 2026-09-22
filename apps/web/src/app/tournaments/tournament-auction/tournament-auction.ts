import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuctionItemPublic, AuctionPublicView } from '@hockeyspare/contracts';
import { Subscription, interval, switchMap } from 'rxjs';
import { AuctionApiService } from '../../core/services/auction-api.service';

const POLL_MS = 15000;
const TICK_MS = 1000;
const BIDDER_STORAGE_KEY = 'hs-auction-bidder';

interface StoredBidder {
  name: string;
  email: string;
  phone: string;
}

@Component({
  selector: 'app-tournament-auction',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './tournament-auction.html',
})
export class TournamentAuctionComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(AuctionApiService);
  private readonly fb = inject(NonNullableFormBuilder);

  private pollSub: Subscription | null = null;
  private tickId: ReturnType<typeof setInterval> | null = null;

  tournamentId = this.route.snapshot.paramMap.get('id') ?? '';

  view = signal<AuctionPublicView | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  now = signal(Date.now());

  openBidItemId = signal<string | null>(null);
  submitting = signal(false);
  bidError = signal<string | null>(null);
  lastResult = signal<{
    itemId: string;
    leading: boolean;
    wonViaBuyNow: boolean;
    claimUrl: string;
  } | null>(null);

  bidForm = this.fb.group({
    bidderName: ['', Validators.required],
    bidderEmail: ['', [Validators.required, Validators.email]],
    bidderPhone: [''],
    amountDollars: [0, [Validators.required, Validators.min(1)]],
  });

  auctionOpen = computed(() => this.view()?.auction.status === 'OPEN');

  ngOnInit(): void {
    this.restoreBidder();
    this.load();

    this.pollSub = interval(POLL_MS)
      .pipe(switchMap(() => this.api.getPublic(this.tournamentId)))
      .subscribe({ next: (v) => this.view.set(v) });

    this.tickId = setInterval(() => this.now.set(Date.now()), TICK_MS);
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
    if (this.tickId !== null) clearInterval(this.tickId);
  }

  private load(): void {
    this.api.getPublic(this.tournamentId).subscribe({
      next: (v) => {
        this.view.set(v);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('This tournament has no auction.');
        this.loading.set(false);
      },
    });
  }

  private restoreBidder(): void {
    try {
      const raw = localStorage.getItem(BIDDER_STORAGE_KEY);
      if (!raw) return;
      const b = JSON.parse(raw) as StoredBidder;
      this.bidForm.patchValue({
        bidderName: b.name ?? '',
        bidderEmail: b.email ?? '',
        bidderPhone: b.phone ?? '',
      });
    } catch {
      // ignore unreadable storage
    }
  }

  private rememberBidder(): void {
    try {
      const v = this.bidForm.getRawValue();
      localStorage.setItem(
        BIDDER_STORAGE_KEY,
        JSON.stringify({
          name: v.bidderName,
          email: v.bidderEmail,
          phone: v.bidderPhone,
        }),
      );
    } catch {
      // ignore
    }
  }

  items(): AuctionItemPublic[] {
    return this.view()?.items ?? [];
  }

  openItems(): AuctionItemPublic[] {
    return this.items().filter((i) => i.status === 'OPEN');
  }

  closedItems(): AuctionItemPublic[] {
    return this.items().filter((i) => i.status !== 'OPEN');
  }

  toggleBid(item: AuctionItemPublic): void {
    this.bidError.set(null);
    if (this.openBidItemId() === item.id) {
      this.openBidItemId.set(null);
      return;
    }
    this.openBidItemId.set(item.id);
    this.bidForm.patchValue({
      amountDollars: Math.ceil(item.minNextBidCents / 100),
    });
  }

  quickBid(item: AuctionItemPublic, increments: number): void {
    const cents = item.minNextBidCents + increments * item.minIncrementCents;
    this.bidForm.patchValue({ amountDollars: Math.ceil(cents / 100) });
  }

  timeLeft(item: AuctionItemPublic): string | null {
    if (!item.closesAt) return null;
    const diff = new Date(item.closesAt).getTime() - this.now();
    if (diff <= 0) return 'Closing…';
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (d > 0) return `${d}d ${h}h left`;
    if (h > 0) return `${h}h ${m}m left`;
    return `${m}m ${s}s left`;
  }

  submitBid(item: AuctionItemPublic): void {
    if (this.bidForm.invalid || this.submitting()) {
      this.bidForm.markAllAsTouched();
      return;
    }

    const v = this.bidForm.getRawValue();
    this.submitting.set(true);
    this.bidError.set(null);

    this.api
      .placeBid(this.tournamentId, item.id, {
        bidderName: v.bidderName.trim(),
        bidderEmail: v.bidderEmail.trim(),
        bidderPhone: v.bidderPhone.trim() || null,
        maxAmountCents: Math.round(v.amountDollars * 100),
      })
      .subscribe({
        next: (result) => {
          this.submitting.set(false);
          this.rememberBidder();
          this.openBidItemId.set(null);
          this.lastResult.set({
            itemId: item.id,
            leading: result.youAreLeading,
            wonViaBuyNow: result.wonViaBuyNow,
            claimUrl: result.claimUrl,
          });
          this.api.getPublic(this.tournamentId).subscribe({
            next: (view) => this.view.set(view),
          });
        },
        error: (err) => {
          this.submitting.set(false);
          this.bidError.set(
            err?.error?.message || 'Could not place that bid.',
          );
        },
      });
  }

  buyNow(item: AuctionItemPublic): void {
    if (!item.buyNowCents) return;
    this.openBidItemId.set(item.id);
    this.bidForm.patchValue({
      amountDollars: Math.ceil(item.buyNowCents / 100),
    });
  }

  trackById(_i: number, item: AuctionItemPublic): string {
    return item.id;
  }
}
