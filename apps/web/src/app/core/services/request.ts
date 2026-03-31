import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SpareRequest } from '../../shared/models/request.model';

@Injectable({ providedIn: 'root' })
export class RequestService {
  private readonly baseUrl = '/api/requests';

  constructor(private http: HttpClient) {}

  getAll(): Observable<SpareRequest[]> {
    return this.http.get<SpareRequest[]>(`${this.baseUrl}/requests`);
  }

  getById(id: number): Observable<SpareRequest> {
    return this.http.get<SpareRequest>(`${this.baseUrl}/requests/${id}`);
  }

  teamRequest(payload: Omit<SpareRequest, 'id' | 'type'>): Observable<SpareRequest> {
    return this.http.post<SpareRequest>(`${this.baseUrl}/api/requests`, payload);
  }

   playerRequest(payload: Omit<SpareRequest, 'id' | 'type'>): Observable<SpareRequest> {
    return this.http.post<SpareRequest>(`${this.baseUrl}/api/requests`, payload);
  }

}
