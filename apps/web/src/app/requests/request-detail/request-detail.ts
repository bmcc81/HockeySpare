import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map, shareReplay, switchMap } from 'rxjs/operators';

import { RequestApiService } from '../../core/services/request-api';
import { BookingApiService } from '../../core/services/bookings.service';
import { RequestType, SpareRequest } from '@hockeyspare/contracts';
import { TranslatePipe, LocalDatePipe } from '../../core/i18n/t.pipe';
import { I18nService } from '../../core/i18n/i18n.service';
import { LoaderComponent } from '../../shared/loader/loader';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [LoaderComponent, CommonModule, RouterModule, TranslatePipe, LocalDatePipe],
  templateUrl: './request-detail.html',
  styleUrl: './request-detail.scss',
})
export class RequestDetailComponent {
  readonly RequestType = RequestType;

  private readonly route = inject(ActivatedRoute);

  private readonly i18n = inject(I18nService);
  private readonly api = inject(RequestApiService);
  private readonly bookingsApi = inject(BookingApiService);

  error = signal('');
  success = signal('');
  bookingLoading = signal(false);
  bookingMessage = signal('');

  request$: Observable<SpareRequest> = this.route.paramMap.pipe(
    map((pm) => Number(pm.get('id'))),
    filter((id): id is number => Number.isFinite(id) && id > 0),
    switchMap((id) => this.api.getRequestById(id)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  setBookingMessage(value: string): void {
    this.bookingMessage.set(value);
  }

  bookRequest(req: SpareRequest): void {
    if (req.status !== 'OPEN') {
      this.error.set(this.i18n.t('This request is not open for booking.'));
      this.success.set('');
      return;
    }

    this.bookingLoading.set(true);
    this.error.set('');
    this.success.set('');

    this.bookingsApi.createBooking(req.id, this.bookingMessage()).subscribe({
      next: () => {
        this.success.set(this.i18n.t('Booking sent.'));
        this.bookingMessage.set('');
        this.bookingLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || this.i18n.t('Could not create booking.'));
        this.success.set('');
        this.bookingLoading.set(false);
      },
    });
  }

  nameLabel(req: SpareRequest): string {
    return req.type === RequestType.PLAYER_NEEDS_TEAM
      ? 'Player Name'
      : 'Team Name';
  }

  nameValue(req: SpareRequest): string {
    const name =
      req.type === RequestType.PLAYER_NEEDS_TEAM
        ? req.playerName
        : req.teamName;

    return name ?? 'N/A';
  }
}