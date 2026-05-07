import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED';

@Injectable({ providedIn: 'root' })
export class BookingApiService {
  private readonly http = inject(HttpClient);

  createBooking(requestId: number, message?: string) {
    return this.http.post(`/api/bookings/requests/${requestId}`, {
      message: message?.trim() || null,
    });
  }

  getMyBookings() {
    return this.http.get(`/api/bookings/mine`);
  }

  getIncomingBookings() {
    return this.http.get(`/api/bookings/incoming`);
  }

  updateBookingStatus(
    bookingId: string,
    status: 'CONFIRMED' | 'DECLINED',
    message?: string,
  ) {
    return this.http.patch(`/api/bookings/${bookingId}/status`, {
      status,
      message: message?.trim() || null,
    });
  }

  cancelMyBooking(bookingId: string) {
    return this.http.patch(`/api/bookings/${bookingId}/cancel`, {});
  }

  updateBookingMessage(bookingId: string, message: string) {
    return this.http.patch(`/api/bookings/${bookingId}/message`, {
      message: message?.trim() || null,
    });
  }
}
