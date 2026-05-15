import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  GameScoreSheetDto,
  UpdateScoreSheetInput,
  UpsertScoreSheetPlayerInput,
} from '@hockeyspare/contracts';

@Injectable({
  providedIn: 'root',
})
export class ScoreSheetsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/score-sheets';

  getByGame(gameId: string): Observable<GameScoreSheetDto> {
    return this.http.get<GameScoreSheetDto>(`${this.baseUrl}/game/${gameId}`);
  }

  createForGame(
    gameId: string,
    input: UpdateScoreSheetInput = {},
  ): Observable<GameScoreSheetDto> {
    return this.http.post<GameScoreSheetDto>(
      `${this.baseUrl}/game/${gameId}`,
      input,
    );
  }

  updateScoreSheet(
    scoreSheetId: string,
    input: UpdateScoreSheetInput,
  ): Observable<GameScoreSheetDto> {
    return this.http.patch<GameScoreSheetDto>(
      `${this.baseUrl}/${scoreSheetId}`,
      input,
    );
  }

  upsertPlayerLine(
    scoreSheetId: string,
    input: UpsertScoreSheetPlayerInput,
  ): Observable<GameScoreSheetDto> {
    return this.http.post<GameScoreSheetDto>(
      `${this.baseUrl}/${scoreSheetId}/players`,
      input,
    );
  }

  updatePlayerLine(
    scoreSheetId: string,
    lineId: string,
    input: UpsertScoreSheetPlayerInput,
  ): Observable<GameScoreSheetDto> {
    return this.http.patch<GameScoreSheetDto>(
      `${this.baseUrl}/${scoreSheetId}/players/${lineId}`,
      input,
    );
  }

  deletePlayerLine(
    scoreSheetId: string,
    lineId: string,
  ): Observable<GameScoreSheetDto> {
    return this.http.delete<GameScoreSheetDto>(
      `${this.baseUrl}/${scoreSheetId}/players/${lineId}`,
    );
  }

  finalizeScoreSheet(scoreSheetId: string): Observable<GameScoreSheetDto> {
    return this.http.post<GameScoreSheetDto>(
       `${this.baseUrl}/${scoreSheetId}/finalize`,
      {},
    );
  }
}
