import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuctionAdminView, AuctionItemAdmin } from '@hockeyspare/contracts';
import { Subscription, interval, switchMap } from 'rxjs';
import { AuctionApiService } from '../../core/services/auction-api.service';

const POLL_MS = 20000;

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

@Component({
  selector: 'app-tournament-manage-auction',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './tournament-manage-auction.html',
})
export class TournamentManageAuctionComponent implements OnInit, OnDestroy {
  @Input({ required: true }) tournamentId!: string;

  private readonly api = inject(AuctionApiService);
  private readonly fb = inject(NonNullableFormBuilder);

  private pollSub: Subscription | null = null;

  view = signal<AuctionAdminView | null>(null);
  enabled = signal(false);
  loading = signal(true);
  busy = signal(false);
  error = signal<string | null>(null);

  editingItemId = signal<string | null>(null);
  expandedItemId = signal<string | null>(null);

  settingsForm = this.fb.group({
    title: ['Silent Auction', Validators.required],
    description: [''],
    opensAt: [''],
    closesAt: [''],
    antiSnipeMinutes: [2, [Validators.min(0), Validators.max(60)]],
  });

  itemForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    donorName: [''],
    startingBidDollars: [0, [Validators.min(0)]],
    minIncrementDollars: [5, [Validators.min(1)]],
    buyNowDollars: [0],
    fairMarketValueDollars: [0],
    closesAt: [''],
  });

  ngOnInit(): void {
    this.load();
    this.pollSub = interval(POLL_MS)
      .pipe(switchMap(() => this.api.getAdmin(this.tournamentId)))
      .subscribe({
        next: (v) => {
          this.enabled.set(true);
          this.view.set(v);
        },
        error: () => undefined,
      });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  private load(): void {
    this.api.getAdmin(this.tournamentId).subscribe({
      next: (v) => {
        this.enabled.set(true);
        this.applyView(v);
        this.loading.set(false);
      },
      error: () => {
        this.enabled.set(false);
        this.loading.set(false);
      },
    });
  }

  private applyView(v: AuctionAdminView): void {
    this.view.set(v);
    this.settingsForm.patchValue({
      title: v.auction.title,
      description: v.auction.description ?? '',
      opensAt: toLocalInput(v.auction.opensAt),
      closesAt: toLocalInput(v.auction.closesAt),
      antiSnipeMinutes: v.auction.antiSnipeMinutes,
    });
  }

  enable(): void {
    this.busy.set(true);
    this.api
      .createOrEnable(this.tournamentId, { title: 'Silent Auction' })
      .subscribe({
        next: (v) => {
          this.enabled.set(true);
          this.applyView(v);
          this.busy.set(false);
        },
        error: (err) => this.fail(err),
      });
  }

  saveSettings(): void {
    const v = this.settingsForm.getRawValue();
    this.busy.set(true);
    this.api
      .update(this.tournamentId, {
        title: v.title.trim(),
        description: v.description.trim() || null,
        opensAt: v.opensAt ? new Date(v.opensAt).toISOString() : null,
        closesAt: v.closesAt ? new Date(v.closesAt).toISOString() : null,
        antiSnipeMinutes: v.antiSnipeMinutes,
      })
      .subscribe({
        next: (view) => {
          this.applyView(view);
          this.busy.set(false);
        },
        error: (err) => this.fail(err),
      });
  }

  setStatus(status: 'DRAFT' | 'OPEN'): void {
    this.busy.set(true);
    this.api.update(this.tournamentId, { status }).subscribe({
      next: (v) => {
        this.applyView(v);
        this.busy.set(false);
      },
      error: (err) => this.fail(err),
    });
  }

  closeAuction(): void {
    if (!confirm('Close the whole auction and finalize every open item?')) return;
    this.busy.set(true);
    this.api.closeAuction(this.tournamentId).subscribe({
      next: (v) => {
        this.applyView(v);
        this.busy.set(false);
      },
      error: (err) => this.fail(err),
    });
  }

  startNewItem(): void {
    this.editingItemId.set('new');
    this.itemForm.reset({
      name: '',
      description: '',
      donorName: '',
      startingBidDollars: 0,
      minIncrementDollars: 5,
      buyNowDollars: 0,
      fairMarketValueDollars: 0,
      closesAt: '',
    });
  }

  editItem(item: AuctionItemAdmin): void {
    this.editingItemId.set(item.id);
    this.itemForm.reset({
      name: item.name,
      description: item.description ?? '',
      donorName: item.donorName ?? '',
      startingBidDollars: item.startingBidCents / 100,
      minIncrementDollars: item.minIncrementCents / 100,
      buyNowDollars: item.buyNowCents ? item.buyNowCents / 100 : 0,
      fairMarketValueDollars: item.fairMarketValueCents
        ? item.fairMarketValueCents / 100
        : 0,
      closesAt: toLocalInput(item.closesAt),
    });
  }

  cancelItemEdit(): void {
    this.editingItemId.set(null);
  }

  saveItem(): void {
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }
    const v = this.itemForm.getRawValue();
    const payload = {
      name: v.name.trim(),
      description: v.description.trim() || null,
      donorName: v.donorName.trim() || null,
      startingBidCents: Math.round(v.startingBidDollars * 100),
      minIncrementCents: Math.round(v.minIncrementDollars * 100),
      buyNowCents: v.buyNowDollars > 0 ? Math.round(v.buyNowDollars * 100) : null,
      fairMarketValueCents:
        v.fairMarketValueDollars > 0
          ? Math.round(v.fairMarketValueDollars * 100)
          : null,
      closesAt: v.closesAt ? new Date(v.closesAt).toISOString() : null,
    };
    this.busy.set(true);
    const id = this.editingItemId();
    const req =
      id && id !== 'new'
        ? this.api.updateItem(this.tournamentId, id, payload)
        : this.api.addItem(this.tournamentId, payload);
    req.subscribe({
      next: (view) => {
        this.applyView(view);
        this.editingItemId.set(null);
        this.busy.set(false);
      },
      error: (err) => this.fail(err),
    });
  }

  deleteItem(item: AuctionItemAdmin): void {
    if (!confirm(`Delete "${item.name}"?`)) return;
    this.busy.set(true);
    this.api.deleteItem(this.tournamentId, item.id).subscribe({
      next: () => {
        this.api.getAdmin(this.tournamentId).subscribe({
          next: (v) => this.applyView(v),
        });
        this.busy.set(false);
      },
      error: (err) => this.fail(err),
    });
  }

  onImage(item: AuctionItemAdmin, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.busy.set(true);
    this.api.uploadItemImage(this.tournamentId, item.id, file).subscribe({
      next: (view) => {
        this.applyView(view);
        this.busy.set(false);
      },
      error: (err) => this.fail(err),
    });
  }

  closeItem(item: AuctionItemAdmin): void {
    if (!confirm(`Close bidding on "${item.name}" now?`)) return;
    this.busy.set(true);
    this.api.closeItem(this.tournamentId, item.id).subscribe({
      next: (v) => {
        this.applyView(v);
        this.busy.set(false);
      },
      error: (err) => this.fail(err),
    });
  }

  markPaid(item: AuctionItemAdmin, paid: boolean): void {
    this.busy.set(true);
    this.api.updateFulfillment(this.tournamentId, item.id, { paid }).subscribe({
      next: (v) => {
        this.applyView(v);
        this.busy.set(false);
      },
      error: (err) => this.fail(err),
    });
  }

  markFulfilled(item: AuctionItemAdmin, fulfilled: boolean): void {
    this.busy.set(true);
    this.api
      .updateFulfillment(this.tournamentId, item.id, { fulfilled })
      .subscribe({
        next: (v) => {
          this.applyView(v);
          this.busy.set(false);
        },
        error: (err) => this.fail(err),
      });
  }

  voidBid(item: AuctionItemAdmin, bidId: string): void {
    if (!confirm('Remove this bid?')) return;
    this.busy.set(true);
    this.api.voidBid(this.tournamentId, item.id, bidId).subscribe({
      next: (v) => {
        this.applyView(v);
        this.busy.set(false);
      },
      error: (err) => this.fail(err),
    });
  }

  toggleExpanded(itemId: string): void {
    this.expandedItemId.set(this.expandedItemId() === itemId ? null : itemId);
  }

  private fail(err: unknown): void {
    this.busy.set(false);
    const message =
      (err as { error?: { message?: string } })?.error?.message ??
      'Something went wrong.';
    this.error.set(message);
  }
}
