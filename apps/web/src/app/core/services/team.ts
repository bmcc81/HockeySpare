import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  MyTeamResponse,
  PlayerStat,
  TeamGame,
  TeamGameAvailabilityStatus,
  TeamMember,
} from '@hockeyspare/contracts';
import { Observable } from 'rxjs';

export type TeamMemberRole = 'PLAYER' | 'CAPTAIN' | 'GENERAL_MANAGER';
export type TeamMemberType = 'REGULAR' | 'SPARE';
export type TeamPosition = 'GOALIE' | 'DEFENSE' | 'FORWARD';

export interface CreateMyTeamInput {
  name: string;
}

export interface UpdateMyTeamInput {
  name: string;
}

export interface CreateTeamMemberInput {
  displayName: string;
  email?: string | null;
  phone?: string | null;
  position?: TeamPosition | string | null;
  memberType: TeamMemberType | string;
  notifyByApp?: boolean;
  notifyByEmail?: boolean;
}

export interface CreateTeamGameInput {
  title: string;
  startsAt: string;
  arena?: string | null;
  opponent?: string | null;
  notes?: string | null;
}

export interface UpsertPlayerStatInput {
  season: string;
  gamesPlayed: number;
  goals: number;
  assists: number;
  penaltyMins: number;
}

export interface NotifyTeamGameResult {
  emailSentCount?: number;
  skippedAlreadyNotifiedCount?: number;
}

@Injectable({
  providedIn: 'root',
})
export class TeamService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/my-team';

  private teamParams(teamId?: string | null): HttpParams {
    let params = new HttpParams();

    if (teamId) {
      params = params.set('teamId', teamId);
    }

    return params;
  }

  getMyTeam(teamId?: string | null): Observable<MyTeamResponse> {
    return this.http.get<MyTeamResponse>(this.baseUrl, {
      params: this.teamParams(teamId),
    });
  }

  createMyTeam(input: CreateMyTeamInput): Observable<MyTeamResponse> {
    return this.http.post<MyTeamResponse>(this.baseUrl, input);
  }

  updateMyTeam(
    input: UpdateMyTeamInput,
    teamId?: string | null,
  ): Observable<MyTeamResponse> {
    return this.http.patch<MyTeamResponse>(this.baseUrl, input, {
      params: this.teamParams(teamId),
    });
  }

  addMember(
    input: CreateTeamMemberInput,
    teamId?: string | null,
  ): Observable<TeamMember> {
    return this.http.post<TeamMember>(`${this.baseUrl}/members`, input, {
      params: this.teamParams(teamId),
    });
  }

  removeMember(memberId: string, teamId?: string | null): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/members/${memberId}`, {
      params: this.teamParams(teamId),
    });
  }

  updateMemberRole(
    memberId: string,
    role: TeamMemberRole,
    teamId?: string | null,
  ): Observable<TeamMember> {
    return this.http.patch<TeamMember>(
      `${this.baseUrl}/members/${memberId}/role`,
      { role },
      {
        params: this.teamParams(teamId),
      },
    );
  }

  linkMemberToUser(
    memberId: string,
    teamId?: string | null,
  ): Observable<TeamMember> {
    return this.http.post<TeamMember>(
      `${this.baseUrl}/members/${memberId}/link-user`,
      {},
      {
        params: this.teamParams(teamId),
      },
    );
  }

  createGame(
    input: CreateTeamGameInput,
    teamId?: string | null,
  ): Observable<TeamGame> {
    return this.http.post<TeamGame>(`${this.baseUrl}/games`, input, {
      params: this.teamParams(teamId),
    });
  }

  notifyGame(
    gameId: string,
    teamId?: string | null,
  ): Observable<NotifyTeamGameResult> {
    return this.http.post<NotifyTeamGameResult>(
      `${this.baseUrl}/games/${gameId}/notify`,
      {},
      {
        params: this.teamParams(teamId),
      },
    );
  }

  respondToGame(
    gameId: string,
    input: {
      status: TeamGameAvailabilityStatus;
      note?: string;
    },
  ): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/games/${gameId}/availability`,
      input,
    );
  }

  getGameAvailability(gameId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/games/${gameId}/availability`);
  }

  getTeamStats(teamId?: string | null): Observable<PlayerStat[]> {
    return this.http.get<PlayerStat[]>(`${this.baseUrl}/stats/team`, {
      params: this.teamParams(teamId),
    });
  }

  getMyStats(): Observable<PlayerStat[]> {
    return this.http.get<PlayerStat[]>(`${this.baseUrl}/stats/me`);
  }

  getMemberStats(
    memberId: string,
    season?: string | null,
    teamId?: string | null,
  ): Observable<PlayerStat | null> {
    let params = this.teamParams(teamId);

    if (season) {
      params = params.set('season', season);
    }

    return this.http.get<PlayerStat | null>(
      `${this.baseUrl}/stats/member/${memberId}`,
      {
        params,
      },
    );
  }

  upsertMemberStats(
    memberId: string,
    input: UpsertPlayerStatInput,
    teamId?: string | null,
  ): Observable<PlayerStat> {
    return this.http.post<PlayerStat>(
      `${this.baseUrl}/stats/member/${memberId}`,
      input,
      {
        params: this.teamParams(teamId),
      },
    );
  }
}
