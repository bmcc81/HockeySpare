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
}