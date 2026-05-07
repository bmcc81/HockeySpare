import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { finalize, take, timeout } from 'rxjs';
import { BookingApiService } from '../../core/services/bookings.service';

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED' | 'CANCELLED';

type MyBooking = {
  id: string;
  requestId: number;
  userId: string;
  status: BookingStatus;
  message: string | null;
  responseMessage?: string | null;
  createdAt: string;
  updatedAt: string;
  request: {
    id: number;
    type: string;
    status: string;
    teamName: string | null;
    playerName?: string | null;
    arena: string;
    arenaAddress?: string | null;
    date?: string | null;
    time: string;
    position: string;
    skillLevel: string;
    payAmount?: number | null;
    notes?: string | null;
  };
};

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-bookings.html',
  styleUrl: './my-bookings.scss',
})
export class MyBookingsComponent implements OnInit {
  private readonly bookingsApi = inject(BookingApiService);

  bookings = signal<MyBooking[]>([]);
  loading = signal(false);
  error = signal('');
  success = signal('');
  savingMessageId = signal<string | null>(null);
  cancellingId = signal<string | null>(null);

  messageDrafts = signal<Record<string, string>>({});

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    this.bookingsApi
      .getMyBookings()
      .pipe(
        take(1),
        timeout(10000),
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: (bookings) => {
          const list = Array.isArray(bookings) ? (bookings as MyBooking[]) : [];
          this.bookings.set(list);

          const drafts: Record<string, string> = {};

          list.forEach((booking) => {
            drafts[booking.id] = booking.message ?? '';
          });

          this.messageDrafts.set(drafts);
        },
        error: (err) => {
          console.error('Failed to load my bookings:', err);
          this.error.set(err?.error?.message || 'Failed to load my bookings.');
          this.bookings.set([]);
        },
      });
  }

  setMessageDraft(bookingId: string, value: string): void {
    this.messageDrafts.update((drafts) => ({
      ...drafts,
      [bookingId]: value,
    }));
  }

  messageDraftFor(booking: MyBooking): string {
    return this.messageDrafts()[booking.id] ?? booking.message ?? '';
  }

  saveMessage(booking: MyBooking): void {
    this.savingMessageId.set(booking.id);
    this.error.set('');
    this.success.set('');

    this.bookingsApi
      .updateBookingMessage(booking.id, this.messageDraftFor(booking))
      .pipe(
        take(1),
        timeout(10000),
        finalize(() => {
          this.savingMessageId.set(null);
        }),
      )
      .subscribe({
        next: () => {
          this.success.set('Message updated.');
          this.load();
        },
        error: (err) => {
          console.error('Failed to update booking message:', err);
          this.error.set(
            err?.error?.message || 'Failed to update booking message.',
          );
        },
      });
  }

  cancelBooking(booking: MyBooking): void {
    this.cancellingId.set(booking.id);
    this.error.set('');
    this.success.set('');

    this.bookingsApi
      .cancelMyBooking(booking.id)
      .pipe(
        take(1),
        timeout(10000),
        finalize(() => {
          this.cancellingId.set(null);
        }),
      )
      .subscribe({
        next: () => {
          this.success.set('Booking cancelled.');
          this.load();
        },
        error: (err) => {
          console.error('Failed to cancel booking:', err);
          this.error.set(err?.error?.message || 'Failed to cancel booking.');
        },
      });
  }

  statusClass(status: BookingStatus): string {
    switch (status) {
      case 'CONFIRMED':
        return 'text-bg-success';
      case 'DECLINED':
      case 'CANCELLED':
        return 'text-bg-danger';
      default:
        return 'text-bg-warning';
    }
  }

  trackByBookingId(_index: number, booking: MyBooking): string {
    return booking.id;
  }
}