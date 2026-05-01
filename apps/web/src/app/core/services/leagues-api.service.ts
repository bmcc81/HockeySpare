import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  CreateLeagueGameInput,
  CreateLeagueInput,
  CreateLeagueTeamInput,
  LeagueDto,
  TeamDto,
  TeamGameDto,
} from '@hockeyspare/contracts';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LeaguesApiService {
  private readonly http = inject(HttpClient);

  list(): Observable<LeagueDto[]> {
    return this.http.get<LeagueDto[]>('/api/leagues');
  }

  create(input: CreateLeagueInput): Observable<LeagueDto> {
    return this.http.post<LeagueDto>('/api/leagues', input);
  }

  getById(id: string): Observable<LeagueDto> {
    return this.http.get<LeagueDto>(`/api/leagues/${id}`);
  }

  listTeams(leagueId: string): Observable<TeamDto[]> {
    return this.http.get<TeamDto[]>(`/api/leagues/${leagueId}/teams`);
  }

  addTeam(leagueId: string, input: CreateLeagueTeamInput): Observable<TeamDto> {
    return this.http.post<TeamDto>(`/api/leagues/${leagueId}/teams`, input);
  }

  listGames(leagueId: string): Observable<TeamGameDto[]> {
    return this.http.get<TeamGameDto[]>(`/api/leagues/${leagueId}/games`);
  }

  addGame(
    leagueId: string,
    teamId: string,
    input: CreateLeagueGameInput,
  ): Observable<TeamGameDto> {
    return this.http.post<TeamGameDto>(
      `/api/leagues/${leagueId}/teams/${teamId}/games`,
      input,
    );
  }
}
