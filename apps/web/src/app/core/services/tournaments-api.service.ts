import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import {
  AddTournamentCoOrganizerInput,
  AssignTournamentGameRefereeInput,
  CheckoutSessionResult,
  CreateTournamentAnnouncementInput,
  CreateTournamentApiKeyInput,
  CreateTournamentBracketInput,
  CreateTournamentGameInput,
  CreateTournamentInfoListingInput,
  CreateTournamentInput,
  CreateTournamentLostFoundItemInput,
  CreateTournamentRefereeInput,
  CreateTournamentRegistrationInput,
  CreateTournamentSponsorInput,
  CreateTournamentTeamInput,
  CreateTournamentTeamPlayerInput,
  CreateTournamentVenueInput,
  CreateTournamentVolunteerShiftInput,
  CreateTournamentVolunteerSignupInput,
  CreateTournamentWebhookInput,
  FileStorageStatus,
  ScheduleBracketMatchGameInput,
  SubmitTournamentRegistrationResult,
  Tournament,
  TournamentAnnouncement,
  TournamentApiKey,
  TournamentApiKeyCreated,
  TournamentAuditLogEntry,
  TournamentBracket,
  TournamentCheckoutSessionResult,
  TournamentCoOrganizer,
  TournamentGame,
  TournamentGameRefereeAssignment,
  TournamentGamePlayerStat,
  TournamentInfoListing,
  TournamentLostFoundItem,
  TournamentMediaAsset,
  TournamentPaymentRow,
  TournamentPaymentsStatus,
  TournamentPaymentVerification,
  TournamentPlayerLeaderRow,
  TournamentReferee,
  TournamentRegistration,
  ScoresheetOcrStatus,
  ScoresheetScanResult,
  TournamentSponsor,
  TournamentStandingRow,
  TournamentTeam,
  TournamentVenue,
  TournamentVolunteerShift,
  TournamentVolunteerSignup,
  TournamentWebhook,
  UpdateTournamentGameInput,
  UpdateTournamentGameScoreInput,
  UpdateTournamentInfoListingInput,
  UpdateTournamentInput,
  UpdateTournamentLostFoundItemInput,
  UpdateTournamentRegistrationInput,
  UpdateTournamentSponsorInput,
  UpdateTournamentTeamInput,
  UpdateTournamentVenueInput,
  UpsertTournamentGamePlayerStatInput,
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

  getStandings(
    id: string,
    division?: string | null,
  ): Observable<TournamentStandingRow[]> {
    let params = new HttpParams();

    if (division) {
      params = params.set('division', division);
    }

    return this.http.get<TournamentStandingRow[]>(
      `/api/tournaments/${id}/standings`,
      { params },
    );
  }

  getPlayerLeaders(id: string): Observable<TournamentPlayerLeaderRow[]> {
    return this.http.get<TournamentPlayerLeaderRow[]>(
      `/api/tournaments/${id}/leaders`,
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

  updateSponsor(
    tournamentId: string,
    sponsorId: string,
    input: UpdateTournamentSponsorInput,
  ): Observable<TournamentSponsor> {
    return this.http.patch<TournamentSponsor>(
      `/api/tournaments/${tournamentId}/sponsors/${sponsorId}`,
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

  addTeam(
    tournamentId: string,
    input: CreateTournamentTeamInput,
  ): Observable<TournamentTeam> {
    return this.http.post<TournamentTeam>(
      `/api/tournaments/${tournamentId}/teams`,
      input,
    );
  }

  createTeamFromRegistration(
    tournamentId: string,
    registrationId: string,
  ): Observable<TournamentTeam> {
    return this.http.post<TournamentTeam>(
      `/api/tournaments/${tournamentId}/registrations/${registrationId}/team`,
      {},
    );
  }

  updateTeam(
    tournamentId: string,
    teamId: string,
    input: UpdateTournamentTeamInput,
  ): Observable<TournamentTeam> {
    return this.http.patch<TournamentTeam>(
      `/api/tournaments/${tournamentId}/teams/${teamId}`,
      input,
    );
  }

  deleteTeam(
    tournamentId: string,
    teamId: string,
  ): Observable<{ id: string; deleted: boolean }> {
    return this.http.delete<{ id: string; deleted: boolean }>(
      `/api/tournaments/${tournamentId}/teams/${teamId}`,
    );
  }

  addTeamPlayer(
    tournamentId: string,
    teamId: string,
    input: CreateTournamentTeamPlayerInput,
  ) {
    return this.http.post(
      `/api/tournaments/${tournamentId}/teams/${teamId}/players`,
      input,
    );
  }

  removeTeamPlayer(
    tournamentId: string,
    teamId: string,
    playerId: string,
  ): Observable<{ id: string; deleted: boolean }> {
    return this.http.delete<{ id: string; deleted: boolean }>(
      `/api/tournaments/${tournamentId}/teams/${teamId}/players/${playerId}`,
    );
  }

  upsertGamePlayerStat(
    tournamentId: string,
    gameId: string,
    input: UpsertTournamentGamePlayerStatInput,
  ): Observable<TournamentGamePlayerStat> {
    return this.http.post<TournamentGamePlayerStat>(
      `/api/tournaments/${tournamentId}/games/${gameId}/stats`,
      input,
    );
  }

  deleteGamePlayerStat(
    tournamentId: string,
    gameId: string,
    statId: string,
  ): Observable<{ id: string; deleted: boolean }> {
    return this.http.delete<{ id: string; deleted: boolean }>(
      `/api/tournaments/${tournamentId}/games/${gameId}/stats/${statId}`,
    );
  }

  createBracket(
    tournamentId: string,
    input: CreateTournamentBracketInput,
  ): Observable<TournamentBracket> {
    return this.http.post<TournamentBracket>(
      `/api/tournaments/${tournamentId}/brackets`,
      input,
    );
  }

  deleteBracket(
    tournamentId: string,
    bracketId: string,
  ): Observable<{ id: string; deleted: boolean }> {
    return this.http.delete<{ id: string; deleted: boolean }>(
      `/api/tournaments/${tournamentId}/brackets/${bracketId}`,
    );
  }

  scheduleMatchGame(
    tournamentId: string,
    bracketId: string,
    matchId: string,
    input: ScheduleBracketMatchGameInput,
  ): Observable<TournamentGame> {
    return this.http.post<TournamentGame>(
      `/api/tournaments/${tournamentId}/brackets/${bracketId}/matches/${matchId}/game`,
      input,
    );
  }

  addAnnouncement(
    tournamentId: string,
    input: CreateTournamentAnnouncementInput,
  ): Observable<TournamentAnnouncement> {
    return this.http.post<TournamentAnnouncement>(
      `/api/tournaments/${tournamentId}/announcements`,
      input,
    );
  }

  deleteAnnouncement(
    tournamentId: string,
    announcementId: string,
  ): Observable<{ id: string; deleted: boolean }> {
    return this.http.delete<{ id: string; deleted: boolean }>(
      `/api/tournaments/${tournamentId}/announcements/${announcementId}`,
    );
  }

  addVenue(
    tournamentId: string,
    input: CreateTournamentVenueInput,
  ): Observable<TournamentVenue> {
    return this.http.post<TournamentVenue>(
      `/api/tournaments/${tournamentId}/venues`,
      input,
    );
  }

  updateVenue(
    tournamentId: string,
    venueId: string,
    input: UpdateTournamentVenueInput,
  ): Observable<TournamentVenue> {
    return this.http.patch<TournamentVenue>(
      `/api/tournaments/${tournamentId}/venues/${venueId}`,
      input,
    );
  }

  deleteVenue(
    tournamentId: string,
    venueId: string,
  ): Observable<{ id: string; deleted: boolean }> {
    return this.http.delete<{ id: string; deleted: boolean }>(
      `/api/tournaments/${tournamentId}/venues/${venueId}`,
    );
  }

  listCoOrganizers(tournamentId: string): Observable<TournamentCoOrganizer[]> {
    return this.http.get<TournamentCoOrganizer[]>(
      `/api/tournaments/${tournamentId}/co-organizers`,
    );
  }

  addCoOrganizer(
    tournamentId: string,
    input: AddTournamentCoOrganizerInput,
  ): Observable<TournamentCoOrganizer> {
    return this.http.post<TournamentCoOrganizer>(
      `/api/tournaments/${tournamentId}/co-organizers`,
      input,
    );
  }

  removeCoOrganizer(
    tournamentId: string,
    coOrganizerId: string,
  ): Observable<{ id: string; deleted: boolean }> {
    return this.http.delete<{ id: string; deleted: boolean }>(
      `/api/tournaments/${tournamentId}/co-organizers/${coOrganizerId}`,
    );
  }

  listAuditLog(tournamentId: string): Observable<TournamentAuditLogEntry[]> {
    return this.http.get<TournamentAuditLogEntry[]>(
      `/api/tournaments/${tournamentId}/audit-log`,
    );
  }

  listPayments(tournamentId: string): Observable<TournamentPaymentRow[]> {
    return this.http.get<TournamentPaymentRow[]>(
      `/api/tournaments/${tournamentId}/payments`,
    );
  }

  getFileStorageStatus(tournamentId: string): Observable<FileStorageStatus> {
    return this.http.get<FileStorageStatus>(
      `/api/tournaments/${tournamentId}/file-storage/status`,
    );
  }

  uploadLogo(tournamentId: string, file: File): Observable<Tournament> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<Tournament>(
      `/api/tournaments/${tournamentId}/logo`,
      formData,
    );
  }

  uploadRulebook(tournamentId: string, file: File): Observable<Tournament> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<Tournament>(
      `/api/tournaments/${tournamentId}/rulebook`,
      formData,
    );
  }

  addMediaAsset(
    tournamentId: string,
    file: File,
    caption?: string,
  ): Observable<TournamentMediaAsset> {
    const formData = new FormData();
    formData.append('file', file);

    if (caption) {
      formData.append('caption', caption);
    }

    return this.http.post<TournamentMediaAsset>(
      `/api/tournaments/${tournamentId}/media`,
      formData,
    );
  }

  deleteMediaAsset(
    tournamentId: string,
    assetId: string,
  ): Observable<{ id: string; deleted: boolean }> {
    return this.http.delete<{ id: string; deleted: boolean }>(
      `/api/tournaments/${tournamentId}/media/${assetId}`,
    );
  }

  listApiKeys(tournamentId: string): Observable<TournamentApiKey[]> {
    return this.http.get<TournamentApiKey[]>(
      `/api/tournaments/${tournamentId}/api-keys`,
    );
  }

  createApiKey(
    tournamentId: string,
    input: CreateTournamentApiKeyInput,
  ): Observable<TournamentApiKeyCreated> {
    return this.http.post<TournamentApiKeyCreated>(
      `/api/tournaments/${tournamentId}/api-keys`,
      input,
    );
  }

  revokeApiKey(
    tournamentId: string,
    keyId: string,
  ): Observable<{ id: string; deleted: boolean }> {
    return this.http.delete<{ id: string; deleted: boolean }>(
      `/api/tournaments/${tournamentId}/api-keys/${keyId}`,
    );
  }

  listWebhooks(tournamentId: string): Observable<TournamentWebhook[]> {
    return this.http.get<TournamentWebhook[]>(
      `/api/tournaments/${tournamentId}/webhooks`,
    );
  }

  createWebhook(
    tournamentId: string,
    input: CreateTournamentWebhookInput,
  ): Observable<TournamentWebhook> {
    return this.http.post<TournamentWebhook>(
      `/api/tournaments/${tournamentId}/webhooks`,
      input,
    );
  }

  deleteWebhook(
    tournamentId: string,
    webhookId: string,
  ): Observable<{ id: string; deleted: boolean }> {
    return this.http.delete<{ id: string; deleted: boolean }>(
      `/api/tournaments/${tournamentId}/webhooks/${webhookId}`,
    );
  }

  getScoresheetOcrStatus(
    tournamentId: string,
  ): Observable<ScoresheetOcrStatus> {
    return this.http.get<ScoresheetOcrStatus>(
      `/api/tournaments/${tournamentId}/scoresheet-ocr/status`,
    );
  }

  scanScoresheet(
    tournamentId: string,
    gameId: string,
    file: File,
  ): Observable<ScoresheetScanResult> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ScoresheetScanResult>(
      `/api/tournaments/${tournamentId}/games/${gameId}/scoresheet-ocr`,
      formData,
    );
  }

  listReferees(tournamentId: string): Observable<TournamentReferee[]> {
    return this.http.get<TournamentReferee[]>(
      `/api/tournaments/${tournamentId}/referees`,
    );
  }

  createReferee(
    tournamentId: string,
    input: CreateTournamentRefereeInput,
  ): Observable<TournamentReferee> {
    return this.http.post<TournamentReferee>(
      `/api/tournaments/${tournamentId}/referees`,
      input,
    );
  }

  deleteReferee(
    tournamentId: string,
    refereeId: string,
  ): Observable<{ id: string; deleted: boolean }> {
    return this.http.delete<{ id: string; deleted: boolean }>(
      `/api/tournaments/${tournamentId}/referees/${refereeId}`,
    );
  }

  assignRefereeToGame(
    tournamentId: string,
    gameId: string,
    input: AssignTournamentGameRefereeInput,
  ): Observable<TournamentGameRefereeAssignment> {
    return this.http.post<TournamentGameRefereeAssignment>(
      `/api/tournaments/${tournamentId}/games/${gameId}/referees`,
      input,
    );
  }

  unassignRefereeFromGame(
    tournamentId: string,
    gameId: string,
    assignmentId: string,
  ): Observable<{ id: string; deleted: boolean }> {
    return this.http.delete<{ id: string; deleted: boolean }>(
      `/api/tournaments/${tournamentId}/games/${gameId}/referees/${assignmentId}`,
    );
  }

  createVolunteerShift(
    tournamentId: string,
    input: CreateTournamentVolunteerShiftInput,
  ): Observable<TournamentVolunteerShift> {
    return this.http.post<TournamentVolunteerShift>(
      `/api/tournaments/${tournamentId}/volunteer-shifts`,
      input,
    );
  }

  deleteVolunteerShift(
    tournamentId: string,
    shiftId: string,
  ): Observable<{ id: string; deleted: boolean }> {
    return this.http.delete<{ id: string; deleted: boolean }>(
      `/api/tournaments/${tournamentId}/volunteer-shifts/${shiftId}`,
    );
  }

  signUpForVolunteerShift(
    tournamentId: string,
    shiftId: string,
    input: CreateTournamentVolunteerSignupInput,
  ): Observable<TournamentVolunteerSignup> {
    return this.http.post<TournamentVolunteerSignup>(
      `/api/tournaments/${tournamentId}/volunteer-shifts/${shiftId}/signups`,
      input,
    );
  }

  listVolunteerSignups(
    tournamentId: string,
    shiftId: string,
  ): Observable<TournamentVolunteerSignup[]> {
    return this.http.get<TournamentVolunteerSignup[]>(
      `/api/tournaments/${tournamentId}/volunteer-shifts/${shiftId}/signups`,
    );
  }

  createInfoListing(
    tournamentId: string,
    input: CreateTournamentInfoListingInput,
  ): Observable<TournamentInfoListing> {
    return this.http.post<TournamentInfoListing>(
      `/api/tournaments/${tournamentId}/info-listings`,
      input,
    );
  }

  updateInfoListing(
    tournamentId: string,
    listingId: string,
    input: UpdateTournamentInfoListingInput,
  ): Observable<TournamentInfoListing> {
    return this.http.patch<TournamentInfoListing>(
      `/api/tournaments/${tournamentId}/info-listings/${listingId}`,
      input,
    );
  }

  deleteInfoListing(
    tournamentId: string,
    listingId: string,
  ): Observable<{ id: string; deleted: boolean }> {
    return this.http.delete<{ id: string; deleted: boolean }>(
      `/api/tournaments/${tournamentId}/info-listings/${listingId}`,
    );
  }

  createLostFoundItem(
    tournamentId: string,
    input: CreateTournamentLostFoundItemInput,
  ): Observable<TournamentLostFoundItem> {
    return this.http.post<TournamentLostFoundItem>(
      `/api/tournaments/${tournamentId}/lost-found`,
      input,
    );
  }

  updateLostFoundItem(
    tournamentId: string,
    itemId: string,
    input: UpdateTournamentLostFoundItemInput,
  ): Observable<TournamentLostFoundItem> {
    return this.http.patch<TournamentLostFoundItem>(
      `/api/tournaments/${tournamentId}/lost-found/${itemId}`,
      input,
    );
  }

  deleteLostFoundItem(
    tournamentId: string,
    itemId: string,
  ): Observable<{ id: string; deleted: boolean }> {
    return this.http.delete<{ id: string; deleted: boolean }>(
      `/api/tournaments/${tournamentId}/lost-found/${itemId}`,
    );
  }
}
