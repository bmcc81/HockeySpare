import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  CheckoutSessionResult,
  CreateTournamentGameInput,
  CreateTournamentInput,
  CreateTournamentRegistrationInput,
  CreateTournamentSponsorInput,
  SubmitTournamentRegistrationResult,
  Tournament,
  TournamentCheckoutSessionResult,
  TournamentGame,
  TournamentPaymentsStatus,
  TournamentPaymentVerification,
  TournamentRegistration,
  TournamentSponsor,
  TournamentStandingRow,
  UpdateTournamentGameInput,
  UpdateTournamentGameScoreInput,
  UpdateTournamentInput,
  UpdateTournamentRegistrationInput,
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

  getStandings(id: string): Observable<TournamentStandingRow[]> {
    return this.http.get<TournamentStandingRow[]>(
      `/api/tournaments/${id}/standings`,
    );
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
  ): Observable<SubmitTournamentRegistrationResult> {
    return this.http.post<SubmitTournamentRegistrationResult>(
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

  updateRegistration(
    tournamentId: string,
    registrationId: string,
    input: UpdateTournamentRegistrationInput,
  ): Observable<TournamentRegistration> {
    return this.http.patch<TournamentRegistration>(
      `/api/tournaments/${tournamentId}/registrations/${registrationId}`,
      input,
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

  getPaymentsStatus(
    tournamentId: string,
  ): Observable<TournamentPaymentsStatus> {
    return this.http.get<TournamentPaymentsStatus>(
      `/api/tournaments/${tournamentId}/payments/status`,
    );
  }

  connectStripe(tournamentId: string): Observable<CheckoutSessionResult> {
    return this.http.post<CheckoutSessionResult>(
      `/api/tournaments/${tournamentId}/payments/connect`,
      {},
    );
  }

  refreshStripeStatus(
    tournamentId: string,
  ): Observable<TournamentPaymentsStatus> {
    return this.http.post<TournamentPaymentsStatus>(
      `/api/tournaments/${tournamentId}/payments/refresh`,
      {},
    );
  }

  retryRegistrationCheckout(
    tournamentId: string,
    registrationId: string,
  ): Observable<TournamentCheckoutSessionResult> {
    return this.http.post<TournamentCheckoutSessionResult>(
      `/api/tournaments/${tournamentId}/registrations/${registrationId}/checkout`,
      {},
    );
  }

  verifyRegistrationCheckout(
    tournamentId: string,
    sessionId: string,
  ): Observable<TournamentPaymentVerification> {
    return this.http.get<TournamentPaymentVerification>(
      `/api/tournaments/${tournamentId}/payments/verify/${sessionId}`,
    );
  }
}
