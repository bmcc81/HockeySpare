export type TournamentGameStatus = 'SCHEDULED' | 'LIVE' | 'FINAL';

export type TournamentRegistrationMode = 'OPEN' | 'WAITLIST' | 'CLOSED';

export type TournamentRegistrationEntryStatus = 'CONFIRMED' | 'WAITLISTED';

export interface TournamentGame {
  id: string;
  tournamentId: string;
  homeTeamName: string;
  awayTeamName: string;
  startsAt: string;
  arenaName?: string | null;
  notes?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  status: TournamentGameStatus;
}

export interface TournamentSponsor {
  id: string;
  tournamentId: string;
  name: string;
  logoUrl?: string | null;
  linkUrl?: string | null;
  createdAt: string;
}

export interface CreateTournamentSponsorInput {
  name: string;
  logoUrl?: string | null;
  linkUrl?: string | null;
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
  games: TournamentGame[];
  sponsors: TournamentSponsor[];
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
}

export type UpdateTournamentInput = Partial<CreateTournamentInput>;

export interface CreateTournamentGameInput {
  homeTeamName: string;
  awayTeamName: string;
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
