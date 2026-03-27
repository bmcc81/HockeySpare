import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class BookingApiService {
  private http = inject(HttpClient);

  createBooking(requestId: number, payload: { message?: string }) {
    return this.http.post(`/api/bookings/requests/${requestId}`, payload);
  }

  getMyBookings() {
    return this.http.get(`/api/bookings/mine`);
  }

  getIncomingBookings() {
    return this.http.get(`/api/bookings/incoming`);
  }

  updateBookingStatus(bookingId: string, status: 'CONFIRMED' | 'DECLINED') {
    return this.http.patch(`/api/bookings/${bookingId}/status`, { status });
  }

  cancelMyBooking(bookingId: string) {
    return this.http.patch(`/api/bookings/${bookingId}/cancel`, {});
  }
}