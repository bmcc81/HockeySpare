import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface GenerateSpareMessageRequest {
  teamName: string;
  position: string;
  playersNeeded: number;
  date: string;
  time: string;
  arena: string;
  location: string;
  skillLevel: string;
  notes?: string;
}

export interface GenerateSpareMessageResponse {
  title: string;
  message: string;
  missingFields: string[];
}

@Injectable({
  providedIn: 'root',
})
export class AiMessageService {
  private readonly http = inject(HttpClient);

  generateSpareMessage(
    payload: GenerateSpareMessageRequest,
  ): Observable<GenerateSpareMessageResponse> {
    return this.http.post<GenerateSpareMessageResponse>(
      '/api/ai/generate-spare-message',
      payload,
    );
  }
}