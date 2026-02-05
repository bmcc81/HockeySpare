import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SpareRequest, CreateRequestInput, PlayerOffer } from '@hockeyspare/contracts';

export type CreateRequestPayload = CreateRequestInput;
export type CreatePlayerOfferPayload = Omit<PlayerOffer, 'id'>;

@Injectable({ providedIn: 'root' })
export class RequestApiService {
  private readonly baseUrl = 'http://localhost:3000';

  constructor(private readonly http: HttpClient) {}

  // ---- Requests (/requests)
  getRequests(): Observable<SpareRequest[]> {
    return this.http.get<SpareRequest[]>(`${this.baseUrl}/requests`);
  }

  getRequestById(id: number): Observable<SpareRequest> {
    return this.http.get<SpareRequest>(`${this.baseUrl}/requests/${id}`);
  }

  createRequest(payload: CreateRequestPayload): Observable<SpareRequest> {
    return this.http.post<SpareRequest>(`${this.baseUrl}/requests`, payload);
  }

  // ---- Player offers (/player-offers)
  getPlayerOffers(): Observable<PlayerOffer[]> {
    return this.http.get<PlayerOffer[]>(`${this.baseUrl}/player-offers`);
  }

  createPlayerOffer(payload: CreatePlayerOfferPayload): Observable<PlayerOffer> {
    return this.http.post<PlayerOffer>(`${this.baseUrl}/player-offers`, payload);
  }

  // ✅ Backwards-compatible aliases (fix your TS2339 errors)
  getById(id: number): Observable<SpareRequest> {
    return this.getRequestById(id);
  }

  create(payload: CreateRequestPayload): Observable<SpareRequest> {
    return this.createRequest(payload);
  }
}
