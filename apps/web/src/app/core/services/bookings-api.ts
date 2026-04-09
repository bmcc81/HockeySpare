import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type IncomingBooking = {
  id: string;
  requestId: number;
  userId: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  message: string | null;
  createdAt: string;
  updatedAt: string;
  request: {
    id: number;
    teamName: string | null;
    arena: string;
    date?: string | null;
    time: string;
    status: string;
  };
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
};

@Injectable({ providedIn: 'root' })
export class BookingsApiService {
  constructor(private readonly http: HttpClient) {}

  getIncoming(): Observable<IncomingBooking[]> {
    return this.http.get<IncomingBooking[]>('/api/bookings/incoming');
  }

  updateStatus(bookingId: string, status: 'CONFIRMED' | 'CANCELLED') {
    return this.http.patch(`/api/bookings/${bookingId}/status`, { status });
  }
}