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
  playerStats?: TournamentGamePlayerStat[];
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

export interface TournamentAnnouncement {
  id: string;
  tournamentId: string;
  body: string;
  createdAt: string;
}

export interface CreateTournamentAnnouncementInput {
  body: string;
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
