import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type TeamMemberType = 'REGULAR' | 'SPARE';

export interface TeamMember {
  id: string;
  displayName: string;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
  memberType: TeamMemberType;
  notifyByApp: boolean;
  notifyByEmail: boolean;
}

export type TeamRole = 'PLAYER' | 'CAPTAIN' | 'GENERAL_MANAGER';

export interface MyMembership {
  id: string;
  role: TeamRole;
  memberType: 'REGULAR' | 'SPARE';
  position: 'GOALIE' | 'DEFENSE' | 'FORWARD' | null;
}

export interface MyTeamResponse {
  id: string;
  name: string;
  members: TeamMember[];
  games: TeamGame[];
  myMembership?: MyMembership | null;
  canManageTeam?: boolean;
}

export interface TeamGameInvite {
  id: string;
  status: 'PENDING' | 'SENT' | 'CONFIRMED' | 'DECLINED';
  member: TeamMember;
}

export interface TeamGame {
  id: string;
  title: string;
  startsAt: string;
  arena?: string | null;
  opponent?: string | null;
  notes?: string | null;
  invites: TeamGameInvite[];
}

export interface MyTeamResponse {
  id: string;
  name: string;
  members: TeamMember[];
  games: TeamGame[];
}

export type TeamGameAvailabilityStatus =
  | 'AVAILABLE'
  | 'UNAVAILABLE'
  | 'NEED_SPARE';

export interface TeamGameAvailability {
  id: string;
  gameId: string;
  memberId: string;
  status: TeamGameAvailabilityStatus;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  member: TeamMember;
}

export interface TeamGame {
  id: string;
  title: string;
  startsAt: string;
  arena?: string | null;
  opponent?: string | null;
  notes?: string | null;
  availabilities: TeamGameAvailability[];
}

export interface PlayerStat {
  id: string;
  season: string | null;
  gamesPlayed: number;
  goals: number;
  assists: number;
  penaltyMins: number;
  team: {
    id: string;
    name: string;
  };
  league?: {
    id: string;
    name: string;
    season?: string | null;
  } | null;
}

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
}
