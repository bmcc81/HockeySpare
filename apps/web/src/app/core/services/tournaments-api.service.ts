import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  CreateTournamentGameInput,
  CreateTournamentInput,
  CreateTournamentRegistrationInput,
  CreateTournamentSponsorInput,
  Tournament,
  TournamentGame,
  TournamentRegistration,
  TournamentSponsor,
  UpdateTournamentGameInput,
  UpdateTournamentGameScoreInput,
  UpdateTournamentInput,
} from '@hockeyspare/contracts';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TournamentsApiService {
  private readonly http = inject(HttpClient);

  create(input: CreateTournamentInput): Observable<Tournament> {
    return this.http.post<Tournament>('/api/tournaments', input);
  }

  listMine(): Observable<Tournament[]> {
    return this.http.get<Tournament[]>('/api/tournaments/mine');
  }

  getPublic(id: string): Observable<Tournament> {
    return this.http.get<Tournament>(`/api/tournaments/${id}`);
  }

  update(id: string, input: UpdateTournamentInput): Observable<Tournament> {
    return this.http.patch<Tournament>(`/api/tournaments/${id}`, input);
  }

  addGame(
    tournamentId: string,
    input: CreateTournamentGameInput,
  ): Observable<TournamentGame> {
    return this.http.post<TournamentGame>(
      `/api/tournaments/${tournamentId}/games`,
      input,
    );
  }

  updateGame(
    tournamentId: string,
    gameId: string,
    input: UpdateTournamentGameInput,
  ): Observable<TournamentGame> {
    return this.http.patch<TournamentGame>(
      `/api/tournaments/${tournamentId}/games/${gameId}`,
      input,
    );
  }

  deleteGame(
    tournamentId: string,
    gameId: string,
  ): Observable<{ id: string; deleted: boolean }> {
    return this.http.delete<{ id: string; deleted: boolean }>(
      `/api/tournaments/${tournamentId}/games/${gameId}`,
    );
  }

  updateGameScore(
    tournamentId: string,
    gameId: string,
    input: UpdateTournamentGameScoreInput,
  ): Observable<TournamentGame> {
    return this.http.patch<TournamentGame>(
      `/api/tournaments/${tournamentId}/games/${gameId}`,
      input,
    );
  }

  submitRegistration(
    tournamentId: string,
    input: CreateTournamentRegistrationInput,
  ): Observable<TournamentRegistration> {
    return this.http.post<TournamentRegistration>(
      `/api/tournaments/${tournamentId}/registrations`,
      input,
    );
  }

  listRegistrations(
    tournamentId: string,
  ): Observable<TournamentRegistration[]> {
    return this.http.get<TournamentRegistration[]>(
      `/api/tournaments/${tournamentId}/registrations`,
    );
  }

  deleteRegistration(
    tournamentId: string,
    registrationId: string,
  ): Observable<{ id: string; deleted: boolean }> {
    return this.http.delete<{ id: string; deleted: boolean }>(
      `/api/tournaments/${tournamentId}/registrations/${registrationId}`,
    );
  }

  addSponsor(
    tournamentId: string,
    input: CreateTournamentSponsorInput,
  ): Observable<TournamentSponsor> {
    return this.http.post<TournamentSponsor>(
      `/api/tournaments/${tournamentId}/sponsors`,
      input,
    );
  }

  deleteSponsor(
    tournamentId: string,
    sponsorId: string,
  ): Observable<{ id: string; deleted: boolean }> {
    return this.http.delete<{ id: string; deleted: boolean }>(
      `/api/tournaments/${tournamentId}/sponsors/${sponsorId}`,
    );
  }
}
