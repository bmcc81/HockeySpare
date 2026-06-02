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

export interface RewriteMessageRequest {
  message: string;
  tone?: 'friendly' | 'professional' | 'short' | 'urgent';
  language?: 'en' | 'fr';
}

export interface RewriteMessageResponse {
  message: string;
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

  rewriteMessage(
    payload: RewriteMessageRequest,
  ): Observable<RewriteMessageResponse> {
    return this.http.post<RewriteMessageResponse>(
      '/api/ai/rewrite-message',
      payload,
    );
  }
}
