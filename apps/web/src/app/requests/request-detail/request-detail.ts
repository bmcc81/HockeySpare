import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map, shareReplay, switchMap } from 'rxjs/operators';

import { RequestApiService } from '../../core/services/request-api';
import { BookingApiService } from '../../core/services/bookings.service';
import { SpareRequest, RequestType } from '@hockeyspare/contracts';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './request-detail.html',
  styleUrl: './request-detail.scss',
})
export class RequestDetailComponent {
  readonly RequestType = RequestType;

  private route = inject(ActivatedRoute);
  private api = inject(RequestApiService);
  private bookingsApi = inject(BookingApiService);

  error = signal('');
  success = signal('');
  bookingLoading = signal(false);

  request$: Observable<SpareRequest> = this.route.paramMap.pipe(
    map((pm) => Number(pm.get('id'))),
    filter((id): id is number => Number.isFinite(id) && id > 0),
    switchMap((id) => this.api.getRequestById(id)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  bookRequest(req: SpareRequest): void {
    if (req.status !== 'OPEN') {
      this.error.set('This request is not open for booking.');
      this.success.set('');
      return;
    }

    this.bookingLoading.set(true);
    this.error.set('');
    this.success.set('');

    this.bookingsApi.createBooking(req.id, {}).subscribe({
      next: () => {
        this.success.set('Booking sent.');
        this.bookingLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Could not create booking.');
        this.success.set('');
        this.bookingLoading.set(false);
      },
    });
  }

  nameLabel(req: SpareRequest): string {
    return req.type === RequestType.PLAYER_NEEDS_TEAM ? 'Player Name' : 'Team Name';
  }

  nameValue(req: SpareRequest): string {
    const name =
      req.type === RequestType.PLAYER_NEEDS_TEAM ? req.playerName : req.teamName;

    return name ?? 'N/A';
  }
}