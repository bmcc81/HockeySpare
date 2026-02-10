import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SpareRequest, CreateRequestInput, PlayerOffer } from '@hockeyspare/contracts';

export type CreateRequestPayload = CreateRequestInput;
export type CreatePlayerOfferPayload = Omit<PlayerOffer, 'id'>;

@Injectable({ providedIn: 'root' })
export class RequestApiService {
  constructor(private readonly http: HttpClient) {}

  // ---- Requests (/requests)
  getRequests(): Observable<SpareRequest[]> {
    return this.http.get<SpareRequest[]>('/requests');
  }

  getRequestById(id: number): Observable<SpareRequest> {
    return this.http.get<SpareRequest>(`/requests/${id}`);
  }

  createRequest(payload: CreateRequestPayload): Observable<SpareRequest> {
    return this.http.post<SpareRequest>('/requests', payload);
  }

  // ---- Player offers (/player-offers)
  getPlayerOffers(): Observable<PlayerOffer[]> {
    return this.http.get<PlayerOffer[]>('/player-offers');
  }

  createPlayerOffer(payload: CreatePlayerOfferPayload): Observable<PlayerOffer> {
    return this.http.post<PlayerOffer>('/player-offers', payload);
  }

  // Backwards-compatible aliases
  getById(id: number): Observable<SpareRequest> {
    return this.getRequestById(id);
  }

  create(payload: CreateRequestPayload): Observable<SpareRequest> {
    return this.createRequest(payload);
  }
}
