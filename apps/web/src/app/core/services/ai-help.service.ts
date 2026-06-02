import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface AskHelpRequest {
  question: string;
}

export interface HelpSource {
  id: string;
  title: string;
  category: string | null;
}

export interface AskHelpResponse {
  answer: string;
  sources: HelpSource[];
}

export interface GenerateSpareMessageRequest {
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
export class AiHelpService {
  private readonly http = inject(HttpClient);

  askHelp(payload: AskHelpRequest): Observable<AskHelpResponse> {
    return this.http.post<AskHelpResponse>('/api/ai/help/ask', payload);
  }

  generateSpareMessage(
    payload: GenerateSpareMessageRequest,
  ): Observable<GenerateSpareMessageResponse> {
    return this.http.post<GenerateSpareMessageResponse>(
      '/api/ai/generate-spare-message',
      payload,
    );
  }
}
