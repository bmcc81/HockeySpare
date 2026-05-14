import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type ScoreSheetStatus = 'DRAFT' | 'FINALIZED';

export interface ScoreSheetUserDto {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface ScoreSheetLeagueDto {
  id: string;
  name: string;
  season?: string | null;
}

export interface ScoreSheetTeamDto {
  id: string;
  name: string;
}

export interface ScoreSheetArenaDto {
  id: string;
  name: string;
  address?: string | null;
}

export interface ScoreSheetGameDto {
  id: string;
  leagueId?: string | null;
  teamId: string;
  opponentTeamId?: string | null;
  arenaId?: string | null;
  title: string;
  startsAt: string;
  opponent?: string | null;
  notes?: string | null;
  team: ScoreSheetTeamDto;
  opponentTeam?: ScoreSheetTeamDto | null;
  arena?: ScoreSheetArenaDto | null;
  league?: ScoreSheetLeagueDto | null;
}

export interface ScoreSheetMemberDto {
  id: string;
  teamId: string;
  userId?: string | null;
  displayName: string;
  email?: string | null;
  phone?: string | null;
  position?: 'GOALIE' | 'DEFENSE' | 'FORWARD' | null;
  memberType: 'REGULAR' | 'SPARE';
  role?: 'PLAYER' | 'CAPTAIN' | 'GENERAL_MANAGER';
  isActive?: boolean;
}

export interface ScoreSheetPlayerLineDto {
  id: string;
  scoreSheetId: string;
  memberId: string;
  gamesPlayed: number;
  goals: number;
  assists: number;
  penaltyMins: number;
  createdAt: string;
  updatedAt: string;
  member: ScoreSheetMemberDto;
}

export interface GameScoreSheetDto {
  id: string | null;
  gameId: string;
  leagueId: string;
  teamId: string;
  teamScore: number;
  opponentScore: number;
  status: ScoreSheetStatus;
  finalizedAt?: string | null;
  finalizedById?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  game: ScoreSheetGameDto;
  league: ScoreSheetLeagueDto;
  team: ScoreSheetTeamDto;
  finalizedBy?: ScoreSheetUserDto | null;
  playerLines: ScoreSheetPlayerLineDto[];
}

export interface UpdateScoreSheetInput {
  teamScore?: number;
  opponentScore?: number;
  notes?: string | null;
}

export interface UpsertScoreSheetPlayerInput {
  memberId: string;
  gamesPlayed?: number;
  goals?: number;
  assists?: number;
  penaltyMins?: number;
}

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

  finalize(scoreSheetId: string): Observable<GameScoreSheetDto> {
    return this.http.post<GameScoreSheetDto>(
      `${this.baseUrl}/${scoreSheetId}/finalize`,
      {},
    );
  }
}