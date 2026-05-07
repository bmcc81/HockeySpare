import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { finalize, take, timeout } from 'rxjs';
import {
  BookingStatus,
  BookingsApiService,
  IncomingBooking,
} from '../../core/services/bookings-api';

type BookingStatusFilter = 'ALL' | BookingStatus;

@Component({
  selector: 'app-incoming-bookings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './incoming-bookings.html',
  styleUrl: './incoming-bookings.scss',
})
export class IncomingBookingsComponent implements OnInit {
  private readonly bookingsApi = inject(BookingsApiService);

  bookings = signal<IncomingBooking[]>([]);
  loading = signal(false);
  error = signal('');
  actionLoadingId = signal<string | null>(null);

  statusFilter = signal<BookingStatusFilter>('ALL');
  searchTerm = signal('');
  dateFilter = signal('');
  responseMessages = signal<Record<string, string>>({});

  filteredBookings = computed(() => {
    const statusFilter = this.statusFilter();
    const searchTerm = this.searchTerm().trim().toLowerCase();
    const dateFilter = this.dateFilter();

    return this.bookings().filter((booking) => {
      const matchesStatus =
        statusFilter === 'ALL' || booking.status === statusFilter;

      const bookingDate = booking.request.date
        ? new Date(booking.request.date).toISOString().slice(0, 10)
        : '';

      const matchesDate = !dateFilter || bookingDate === dateFilter;

      const searchableText = [
        this.fullName(booking),
        booking.user.email,
        booking.status,
        booking.message,
        booking.responseMessage,
        booking.request.teamName,
        booking.request.arena,
        booking.request.date,
        booking.request.time,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !searchTerm || searchableText.includes(searchTerm);

      return matchesStatus && matchesDate && matchesSearch;
    });
  });

  pendingCount = computed(
    () =>
      this.bookings().filter((booking) => booking.status === 'PENDING').length,
  );

  confirmedCount = computed(
    () =>
      this.bookings().filter((booking) => booking.status === 'CONFIRMED')
        .length,
  );

  declinedCount = computed(
    () =>
      this.bookings().filter((booking) => booking.status === 'DECLINED').length,
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');

    this.bookingsApi
      .getIncoming()
      .pipe(
        take(1),
        timeout(10000),
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: (bookings) => {
          this.bookings.set(Array.isArray(bookings) ? bookings : []);
        },
        error: (err) => {
          console.error('Incoming bookings failed:', err);

          this.bookings.set([]);
          this.error.set(
            err?.error?.message ||
              err?.message ||
              'Failed to load incoming bookings.',
          );
        },
      });
  }

  setStatusFilter(status: BookingStatusFilter): void {
    this.statusFilter.set(status);
  }

  setSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  setDateFilter(value: string): void {
    this.dateFilter.set(value);
  }

  clearFilters(): void {
    this.statusFilter.set('ALL');
    this.searchTerm.set('');
    this.dateFilter.set('');
  }

  setResponseMessage(bookingId: string, value: string): void {
    this.responseMessages.update((messages) => ({
      ...messages,
      [bookingId]: value,
    }));
  }

  responseMessageFor(booking: IncomingBooking): string {
    return this.responseMessages()[booking.id] ?? booking.responseMessage ?? '';
  }

  confirmBooking(booking: IncomingBooking): void {
    this.actionLoadingId.set(booking.id);
    this.error.set('');

    const message = this.responseMessageFor(booking);

    this.bookingsApi
      .updateStatus(booking.id, 'CONFIRMED', message)
      .pipe(
        take(1),
        timeout(10000),
        finalize(() => {
          this.actionLoadingId.set(null);
        }),
      )
      .subscribe({
        next: () => {
          this.load();
        },
        error: (err) => {
          console.error('Confirm booking failed:', err);

          this.error.set(
            err?.error?.message || err?.message || 'Failed to confirm booking.',
          );
        },
      });
  }

  cancelBooking(booking: IncomingBooking): void {
    this.actionLoadingId.set(booking.id);
    this.error.set('');

    const message = this.responseMessageFor(booking);

    this.bookingsApi
      .updateStatus(booking.id, 'DECLINED', message)
      .pipe(
        take(1),
        timeout(10000),
        finalize(() => {
          this.actionLoadingId.set(null);
        }),
      )
      .subscribe({
        next: () => {
          this.load();
        },
        error: (err) => {
          console.error('Decline booking failed:', err);

          this.error.set(
            err?.error?.message || err?.message || 'Failed to decline booking.',
          );
        },
      });
  }

  fullName(booking: IncomingBooking): string {
    return (
      [booking.user.firstName, booking.user.lastName]
        .filter(Boolean)
        .join(' ') || booking.user.email
    );
  }

  trackByBookingId(_index: number, booking: IncomingBooking): string {
    return booking.id;
  }
}
