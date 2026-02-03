import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SpareRequest } from '../../shared/models/request.model';

export type CreateRequestPayload = Omit<SpareRequest, 'id'>;

@Injectable({ providedIn: 'root' })
export class RequestApiService {
  public readonly baseUrl = 'http://localhost:3000/requests';

  constructor(public http: HttpClient) {}

  getAll(): Observable<SpareRequest[]> {
    return this.http.get<SpareRequest[]>(this.baseUrl);
  }

  getById(id: number): Observable<SpareRequest> {
    return this.http.get<SpareRequest>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateRequestPayload): Observable<SpareRequest> {
    return this.http.post<SpareRequest>(this.baseUrl, payload);
  }
}
