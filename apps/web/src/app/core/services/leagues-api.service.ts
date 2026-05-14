import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  CreateLeagueGameInput,
  CreateLeagueInput,
  CreateLeagueTeamInput,
  LeagueDto,
  TeamDto,
  TeamGameDto,
  AddLeagueTeamMemberInput,
  TeamMember,
} from '@hockeyspare/contracts';
import { Observable } from 'rxjs';
import { LeagueArenaDto } from '@hockeyspare/contracts';

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

  addArena(
    leagueId: string,
    payload: { name: string; address?: string | null },
  ) {
    return this.http.post<LeagueArenaDto>(
      `/api/leagues/${leagueId}/arenas`,
      payload,
    );
  }

  deleteArena(leagueId: string, arenaId: string) {
    return this.http.delete<void>(`/api/leagues/${leagueId}/arenas/${arenaId}`);
  }

  deleteGame(leagueId: string, teamId: string, gameId: string) {
    return this.http.delete<{ id: string; title: string; deleted: boolean }>(
      `/api/leagues/${leagueId}/teams/${teamId}/games/${gameId}`,
    );
  }

  addTeamMember(
    leagueId: string,
    teamId: string,
    input: AddLeagueTeamMemberInput,
  ) {
    return this.http.post<TeamMember>(
      `/api/leagues/${leagueId}/teams/${teamId}/members`,
      input,
    );
  }

  updateTeamMemberRole(
    leagueId: string,
    teamId: string,
    memberId: string,
    role: 'PLAYER' | 'CAPTAIN' | 'GENERAL_MANAGER',
  ) {
    return this.http.patch<TeamMember>(
      `/api/leagues/${leagueId}/teams/${teamId}/members/${memberId}/role`,
      { role },
    );
  }
}
