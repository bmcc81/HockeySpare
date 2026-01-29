import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SpareRequest } from '../../shared/models/request.model';

@Injectable({ providedIn: 'root' })
export class RequestService {
  private readonly baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getAll(): Observable<SpareRequest[]> {
    return this.http.get<SpareRequest[]>(`${this.baseUrl}/requests`);
  }

  getById(id: number): Observable<SpareRequest> {
    return this.http.get<SpareRequest>(`${this.baseUrl}/requests/${id}`);
  }
}
