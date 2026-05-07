import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED';

export type IncomingBooking = {
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
    return this.http.get<IncomingBooking[]>('/api/bookings/incoming', {
      headers: this.noCacheHeaders(),
      params: this.noCacheParams(),
    });
  }

  updateStatus(
    bookingId: string,
    status: 'CONFIRMED' | 'DECLINED',
    message?: string,
  ): Observable<IncomingBooking> {
    return this.http.patch<IncomingBooking>(
      `/api/bookings/${bookingId}/status`,
      {
        status,
        message: message?.trim() || null,
      },
      {
        headers: this.noCacheHeaders(),
      },
    );
  }

  private noCacheHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    });
  }

  private noCacheParams(): HttpParams {
    return new HttpParams().set('_t', Date.now().toString());
  }
}
