export type TournamentGameStatus = 'SCHEDULED' | 'LIVE' | 'FINAL';

export type TournamentRegistrationMode = 'OPEN' | 'WAITLIST' | 'CLOSED';

export type TournamentRegistrationEntryStatus = 'CONFIRMED' | 'WAITLISTED';

export type TournamentPlayerPosition = 'GOALIE' | 'DEFENSE' | 'FORWARD';

export interface TournamentTeamPlayer {
  id: string;
  teamId: string;
  displayName: string;
  position?: TournamentPlayerPosition | null;
  jerseyNumber?: number | null;
  createdAt: string;
}

export interface CreateTournamentTeamPlayerInput {
  displayName: string;
  position?: TournamentPlayerPosition | null;
  jerseyNumber?: number | null;
}

export interface TournamentTeam {
  id: string;
  tournamentId: string;
  name: string;
  division?: string | null;
  logoUrl?: string | null;
  coachName?: string | null;
  registrationId?: string | null;
  players: TournamentTeamPlayer[];
  createdAt: string;
}

export interface CreateTournamentTeamInput {
  name: string;
  division?: string | null;
  logoUrl?: string | null;
  coachName?: string | null;
  registrationId?: string | null;
}

export type UpdateTournamentTeamInput = Partial<
  Omit<CreateTournamentTeamInput, 'registrationId'>
>;

export interface TournamentGamePlayerStat {
  id: string;
  gameId: string;
  teamPlayerId: string;
  goals: number;
  assists: number;
  penaltyMins: number;
  plusMinus: number;
  teamPlayer: TournamentTeamPlayer;
}

export interface UpsertTournamentGamePlayerStatInput {
  teamPlayerId: string;
  goals?: number;
  assists?: number;
  penaltyMins?: number;
  plusMinus?: number;
}

export interface TournamentPlayerLeaderRow {
  teamPlayerId: string;
  displayName: string;
  teamName: string;
  gamesPlayed: number;
  goals: number;
  assists: number;
  points: number;
  penaltyMins: number;
}

export interface TournamentGameRefereeAssignment {
  id: string;
  gameId: string;
  refereeId: string;
  role?: string | null;
  referee: {
    id: string;
    name: string;
  };
}

export interface TournamentGame {
  id: string;
  tournamentId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  startsAt: string;
  arenaName?: string | null;
  notes?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  status: TournamentGameStatus;
  scoresheetPhotoUrl?: string | null;
  livestreamUrl?: string | null;
  playerStats?: TournamentGamePlayerStat[];
  refereeAssignments?: TournamentGameRefereeAssignment[];
}

export type TournamentSponsorTier = 'GOLD' | 'SILVER' | 'BRONZE';

export interface TournamentSponsor {
  id: string;
  tournamentId: string;
  name: string;
  logoUrl?: string | null;
  linkUrl?: string | null;
  tier?: TournamentSponsorTier | null;
  createdAt: string;
}

export interface CreateTournamentSponsorInput {
  name: string;
  logoUrl?: string | null;
  linkUrl?: string | null;
  tier?: TournamentSponsorTier | null;
}

export type UpdateTournamentSponsorInput = Partial<CreateTournamentSponsorInput>;

export type TournamentAnnouncementType = 'GENERAL' | 'WEATHER';

export interface TournamentAnnouncement {
  id: string;
  tournamentId: string;
  body: string;
  type: TournamentAnnouncementType;
  createdAt: string;
}

export interface CreateTournamentAnnouncementInput {
  body: string;
  type?: TournamentAnnouncementType;
}

export interface TournamentVenue {
  id: string;
  tournamentId: string;
  name: string;
  address?: string | null;
  parkingInfo?: string | null;
  dressingRoomInfo?: string | null;
  concessionsInfo?: string | null;
}

export interface CreateTournamentVenueInput {
  name: string;
  address?: string | null;
  parkingInfo?: string | null;
  dressingRoomInfo?: string | null;
  concessionsInfo?: string | null;
}

export type UpdateTournamentVenueInput = Partial<CreateTournamentVenueInput>;

export interface TournamentBracketMatchTeamRef {
  id: string;
  name: string;
}

export interface TournamentBracketMatchGameRef {
  id: string;
  status: TournamentGameStatus;
  homeScore?: number | null;
  awayScore?: number | null;
  startsAt: string;
}

export interface TournamentBracketMatch {
  id: string;
  bracketId: string;
  round: number;
  position: number;
  team1Id?: string | null;
  team2Id?: string | null;
  gameId?: string | null;
  winnerTeamId?: string | null;
  nextMatchId?: string | null;
  nextMatchSlot?: number | null;
  isBye: boolean;
  team1?: TournamentBracketMatchTeamRef | null;
  team2?: TournamentBracketMatchTeamRef | null;
  winnerTeam?: TournamentBracketMatchTeamRef | null;
  game?: TournamentBracketMatchGameRef | null;
}

export interface TournamentBracket {
  id: string;
  tournamentId: string;
  name: string;
  division?: string | null;
  matches: TournamentBracketMatch[];
}

export interface CreateTournamentBracketInput {
  name: string;
  division?: string | null;
  /** Team IDs in seed order (first = top seed). */
  teamIds: string[];
}

export interface ScheduleBracketMatchGameInput {
  startsAt: string;
  arenaName?: string | null;
  notes?: string | null;
}

export interface Tournament {
  id: string;
  name: string;
  description?: string | null;
  rules?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  leagueId?: string | null;
  createdById: string;
  registrationMode: TournamentRegistrationMode;
  registrationDeadline?: string | null;
  registrationFeeCents?: number | null;
  stripePayoutsEnabled?: boolean;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  logoUrl?: string | null;
  rulebookUrl?: string | null;
  games: TournamentGame[];
  sponsors: TournamentSponsor[];
  teams: TournamentTeam[];
  brackets: TournamentBracket[];
  announcements: TournamentAnnouncement[];
  venues: TournamentVenue[];
  mediaAssets: TournamentMediaAsset[];
  volunteerShifts: TournamentVolunteerShift[];
  infoListings: TournamentInfoListing[];
  lostFoundItems: TournamentLostFoundItem[];
}

export interface TournamentMediaAsset {
  id: string;
  tournamentId: string;
  url: string;
  caption?: string | null;
  createdAt: string;
}

export interface FileStorageStatus {
  configured: boolean;
}

export interface CreateTournamentInput {
  name: string;
  description?: string | null;
  rules?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  leagueId?: string | null;
  registrationMode?: TournamentRegistrationMode;
  registrationDeadline?: string | null;
  registrationFeeCents?: number | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
}

export type UpdateTournamentInput = Partial<CreateTournamentInput>;

export interface CreateTournamentGameInput {
  homeTeamName: string;
  awayTeamName: string;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  startsAt: string;
  arenaName?: string | null;
  notes?: string | null;
  livestreamUrl?: string | null;
}

export type UpdateTournamentGameInput = Partial<CreateTournamentGameInput>;

export interface UpdateTournamentGameScoreInput {
  homeScore?: number;
  awayScore?: number;
  status?: TournamentGameStatus;
}

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  teamName: string;
  division?: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  notes?: string | null;
  status: TournamentRegistrationEntryStatus;
  paid?: boolean;
  createdAt: string;
}

export interface CreateTournamentRegistrationInput {
  teamName: string;
  division?: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  notes?: string | null;
}

export interface SubmitTournamentRegistrationResult {
  registration: TournamentRegistration;
  checkoutUrl: string | null;
}

export interface UpdateTournamentRegistrationInput {
  status: TournamentRegistrationEntryStatus;
}

export interface TournamentPaymentsStatus {
  tournamentId: string;
  connected: boolean;
  payoutsEnabled: boolean;
  stripeConfigured?: boolean;
  registrationFeeCents?: number | null;
}

export interface TournamentCheckoutSessionResult {
  checkoutUrl: string;
}

export type TournamentPaymentVerification = {
  status: string;
  registration: TournamentRegistration;
};

export interface TournamentStandingRow {
  teamName: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifferential: number;
  points: number;
}

export interface TournamentCoOrganizerUserRef {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
}

export interface TournamentCoOrganizer {
  id: string;
  tournamentId: string;
  userId: string;
  createdAt: string;
  user: TournamentCoOrganizerUserRef;
}

export interface AddTournamentCoOrganizerInput {
  email: string;
}

export interface TournamentAuditLogEntry {
  id: string;
  tournamentId: string;
  userId?: string | null;
  action: string;
  detail?: string | null;
  createdAt: string;
  user?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
}

export interface TournamentPaymentRow {
  id: string;
  tournamentId: string;
  registrationId: string;
  amountCents: number;
  currency: string;
  status: string;
  createdAt: string;
  registration: {
    teamName: string;
    contactName: string;
    contactEmail: string;
  };
}

export interface TournamentApiKey {
  id: string;
  tournamentId: string;
  label: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt?: string | null;
  revokedAt?: string | null;
}

export interface TournamentApiKeyCreated extends TournamentApiKey {
  /** Only present on the create response - never shown again after this. */
  key: string;
}

export interface CreateTournamentApiKeyInput {
  label: string;
}

export interface TournamentWebhook {
  id: string;
  tournamentId: string;
  url: string;
  secret: string;
  active: boolean;
  createdAt: string;
}

export interface CreateTournamentWebhookInput {
  url: string;
  secret?: string;
}

export interface ScoresheetOcrStatus {
  configured: boolean;
}

export type ScoresheetPlayerExtraction = {
  teamSide: 'home' | 'away' | null;
  name: string;
  goals: number;
  assists: number;
  penaltyMinutes: number;
};

export interface ScoresheetExtraction {
  homeTeamName: string | null;
  awayTeamName: string | null;
  homeScore: number | null;
  awayScore: number | null;
  players: ScoresheetPlayerExtraction[];
  confidence: 'high' | 'medium' | 'low';
  notes: string | null;
}

export interface ScoresheetScanResult {
  game: TournamentGame;
  extraction: ScoresheetExtraction;
}

export interface TournamentReferee {
  id: string;
  tournamentId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  createdAt: string;
}

export interface CreateTournamentRefereeInput {
  name: string;
  email?: string | null;
  phone?: string | null;
}

export interface AssignTournamentGameRefereeInput {
  refereeId: string;
  role?: string | null;
}

export interface TournamentVolunteerShift {
  id: string;
  tournamentId: string;
  role: string;
  description?: string | null;
  startsAt: string;
  endsAt: string;
  location?: string | null;
  capacity?: number | null;
  createdAt: string;
  _count?: { signups: number };
}

export interface CreateTournamentVolunteerShiftInput {
  role: string;
  description?: string | null;
  startsAt: string;
  endsAt: string;
  location?: string | null;
  capacity?: number | null;
}

export interface TournamentVolunteerSignup {
  id: string;
  shiftId: string;
  name: string;
  email: string;
  phone?: string | null;
  createdAt: string;
}

export interface CreateTournamentVolunteerSignupInput {
  name: string;
  email: string;
  phone?: string | null;
}

export type TournamentInfoListingCategory = 'HOTEL' | 'MERCHANDISE' | 'VENDOR';

export interface TournamentInfoListing {
  id: string;
  tournamentId: string;
  category: TournamentInfoListingCategory;
  title: string;
  description?: string | null;
  url?: string | null;
  imageUrl?: string | null;
  createdAt: string;
}

export interface CreateTournamentInfoListingInput {
  category: TournamentInfoListingCategory;
  title: string;
  description?: string | null;
  url?: string | null;
  imageUrl?: string | null;
}

export type UpdateTournamentInfoListingInput = Partial<CreateTournamentInfoListingInput>;

export type TournamentLostFoundStatus = 'UNCLAIMED' | 'CLAIMED';

export interface TournamentLostFoundItem {
  id: string;
  tournamentId: string;
  description: string;
  imageUrl?: string | null;
  contactInfo?: string | null;
  status: TournamentLostFoundStatus;
  createdAt: string;
}

export interface CreateTournamentLostFoundItemInput {
  description: string;
  imageUrl?: string | null;
  contactInfo?: string | null;
}

export interface UpdateTournamentLostFoundItemInput {
  description?: string;
  imageUrl?: string | null;
  contactInfo?: string | null;
  status?: TournamentLostFoundStatus;
}
