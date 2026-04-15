import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingsApiService, IncomingBooking } from 'src/app/core/services/bookings-api';

@Component({
  selector: 'app-incoming-bookings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './incoming-bookings.html',
  styleUrl: './incoming-bookings.scss',
})
export class IncomingBookingsComponent implements OnInit {
  private readonly bookingsApi = inject(BookingsApiService);

  bookings: IncomingBooking[] = [];
  loading = true;
  error = '';
  actionLoadingId: string | null = null;

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = '';

    this.bookingsApi.getIncoming().subscribe({
      next: (bookings) => {
        this.bookings = bookings;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load incoming bookings.';
        this.loading = false;
      },
    });
  }

  confirmBooking(bookingId: string) {
    this.actionLoadingId = bookingId;

    this.bookingsApi.updateStatus(bookingId, 'CONFIRMED').subscribe({
      next: () => {
        this.actionLoadingId = null;
        this.load();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to confirm booking.';
        this.actionLoadingId = null;
      },
    });
  }

  cancelBooking(bookingId: string) {
    this.actionLoadingId = bookingId;

    this.bookingsApi.updateStatus(bookingId, 'CANCELLED').subscribe({
      next: () => {
        this.actionLoadingId = null;
        this.load();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to cancel booking.';
        this.actionLoadingId = null;
      },
    });
  }

  fullName(booking: IncomingBooking): string {
    return [booking.user.firstName, booking.user.lastName].filter(Boolean).join(' ') || booking.user.email;
  }
}