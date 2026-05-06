import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  MyTeamResponse,
  TeamGameAvailabilityStatus,
  TeamMemberType,
  PlayerStat,
} from '@hockeyspare/contracts';


@Injectable({ providedIn: 'root' })
export class TeamService {
  private http = inject(HttpClient);

  getMyTeam(): Observable<MyTeamResponse> {
    return this.http.get<MyTeamResponse>('/api/my-team', {
      headers: new HttpHeaders({
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      }),
      params: new HttpParams().set('_ts', Date.now().toString()),
    });
  }

  createMyTeam(payload: { name: string }): Observable<MyTeamResponse> {
    return this.http.post<MyTeamResponse>('/api/my-team', payload);
  }

  updateMyTeam(input: { name: string }) {
    return this.http.patch('/api/my-team', input);
  }

  addMember(payload: {
    displayName: string;
    email?: string;
    phone?: string;
    position?: string;
    memberType: TeamMemberType;
    notifyByApp: boolean;
    notifyByEmail: boolean;
  }) {
    return this.http.post('/api/my-team/members', payload);
  }

  removeMember(memberId: string) {
    return this.http.delete(`/api/my-team/members/${memberId}`);
  }

  respondToGame(
    gameId: string,
    payload: { status: TeamGameAvailabilityStatus; note?: string },
  ) {
    return this.http.post(`/api/my-team/games/${gameId}/availability`, payload);
  }

  createGame(payload: {
    title: string;
    startsAt: string;
    arena?: string;
    opponent?: string;
    notes?: string;
  }) {
    return this.http.post('/api/my-team/games', payload);
  }

  notifyGame(gameId: string, memberIds?: string[]) {
    return this.http.post(`/api/my-team/games/${gameId}/notify`, { memberIds });
  }

  getMyStats() {
    return this.http.get<PlayerStat[]>('/api/my-team/stats/me');
  }

  linkMemberToUser(memberId: string) {
    return this.http.post(`/api/my-team/members/${memberId}/link-user`, {});
  }

  upsertMemberStats(
    memberId: string,
    payload: {
      season: string;
      gamesPlayed: number;
      goals: number;
      assists: number;
      penaltyMins: number;
    },
  ) {
    return this.http.post(`/api/my-team/stats/member/${memberId}`, payload);
  }

  getMemberStats(memberId: string, season?: string) {
    const params = new URLSearchParams();

    if (season) {
      params.set('season', season);
    }

    params.set('_ts', Date.now().toString());

    return this.http.get<PlayerStat | null>(
      `/api/my-team/stats/member/${memberId}?${params.toString()}`,
    );
  }
}