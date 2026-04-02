import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';
import {
  SpareRequest,
  CreateRequestInput,
  PlayerOffer,
  CreatePlayerOfferInput,
} from '@hockeyspare/contracts';

export type CreateRequestPayload = CreateRequestInput;
export type CreatePlayerOfferPayload = CreatePlayerOfferInput;

@Injectable({ providedIn: 'root' })
export class RequestApiService {
  private requests$?: Observable<SpareRequest[]>;
  private playerOffers$?: Observable<PlayerOffer[]>;

  constructor(private readonly http: HttpClient) {}

  getRequests(): Observable<SpareRequest[]> {
    if (!this.requests$) {
      this.requests$ = this.http.get<SpareRequest[]>('/api/requests').pipe(shareReplay(1));
    }

    return this.requests$;
  }

  getRequestById(id: number): Observable<SpareRequest> {
    return this.http.get<SpareRequest>(`/api/requests/${id}`);
  }

  createRequest(payload: CreateRequestPayload): Observable<SpareRequest> {
    return this.http.post<SpareRequest>('/api/requests', payload).pipe(
      tap(() => {
        this.requests$ = undefined;
      }),
    );
  }

  getPlayerOffers(): Observable<PlayerOffer[]> {
    if (!this.playerOffers$) {
      this.playerOffers$ = this.http.get<PlayerOffer[]>('/api/player-offers').pipe(shareReplay(1));
    }

    return this.playerOffers$;
  }

  createPlayerOffer(payload: CreatePlayerOfferPayload): Observable<PlayerOffer> {
    return this.http.post<PlayerOffer>('/api/player-offers', payload).pipe(
      tap(() => {
        this.playerOffers$ = undefined;
      }),
    );
  }

  getById(id: number): Observable<SpareRequest> {
    return this.getRequestById(id);
  }

  create(payload: CreateRequestPayload): Observable<SpareRequest> {
    return this.createRequest(payload);
  }
}