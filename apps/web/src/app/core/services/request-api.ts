import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SpareRequest } from '../../shared/models/request.model';

export type CreateRequestPayload = Omit<SpareRequest, 'id'>;

@Injectable({ providedIn: 'root' })
export class RequestApiService {
  private readonly baseUrl = 'http://localhost:3000/requests';

  constructor(private http: HttpClient) {}

  getAll(): Observable<SpareRequest[]> {
    return this.http.get<SpareRequest[]>(this.baseUrl);
  }

  create(payload: CreateRequestPayload): Observable<SpareRequest> {
    return this.http.post<SpareRequest>(this.baseUrl, payload);
  }
}
