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

@Injectable({
  providedIn: 'root',
})
export class AiHelpService {
  private readonly http = inject(HttpClient);

  askHelp(payload: AskHelpRequest): Observable<AskHelpResponse> {
    return this.http.post<AskHelpResponse>('/api/ai/help/ask', payload);
  }
}