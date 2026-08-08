import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { guestGuard } from './auth/guest.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./home/home/home').then((m) => m.HomeComponent),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./auth/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./auth/register/register').then((m) => m.RegisterComponent),
  },
  {
    path: 'requests',
    loadComponent: () =>
      import('./requests/request-list/request-list').then(
        (m) => m.RequestListComponent,
      ),
  },
  {
    path: 'requests/team/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./requests/team-request-create/team-request-create').then(
        (m) => m.TeamRequestCreateComponent,
      ),
  },
  {
    path: 'requests/player/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./requests/player-offer-create/player-offer-create').then(
        (m) => m.PlayerOfferCreateComponent,
      ),
  },
  {
    path: 'requests/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./requests/request-detail/request-detail').then(
        (m) => m.RequestDetailComponent,
      ),
  },
  {
    path: 'profile/player',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./profiles/player-profile/player-profile').then(
        (m) => m.PlayerProfileComponent,
      ),
  },
  {
    path: 'profile/team',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./profiles/team-profile/team-profile').then(
        (m) => m.TeamProfileComponent,
      ),
  },
  {
    path: 'my-team',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./teams/my-team/my-team').then((m) => m.MyTeamComponent),
  },

  // League routes
  {
    path: 'leagues',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./leagues/leagues-list/leagues-list').then(
        (m) => m.LeaguesListComponent,
      ),
  },
  {
    path: 'leagues/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./leagues/create-league/create-league').then(
        (m) => m.CreateLeagueComponent,
      ),
  },
  {
    path: 'leagues/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./leagues/league-detail/league-detail').then(
        (m) => m.LeagueDetailComponent,
      ),
  },
  {
    path: 'score-sheets/games/:gameId',
    loadComponent: () =>
      import('./score-sheets/score-sheet.component').then(
        (m) => m.ScoreSheetComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'messages',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./messaging/chat-list/chat-list').then(
        (m) => m.ChatListComponent,
      ),
  },
  {
    path: 'messages/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./messaging/chat-window/chat-window').then(
        (m) => m.ChatWindowComponent,
      ),
  },
  {
    path: 'my-bookings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./matches/my-bookings/my-bookings').then(
        (m) => m.MyBookingsComponent,
      ),
  },
  {
    path: 'bookings/incoming',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./bookings/incoming-bookings/incoming-bookings').then(
        (m) => m.IncomingBookingsComponent,
      ),
  },
  {
    path: 'help-ai',
    loadComponent: () =>
      import('./help-ai/help-ai.component').then(
        (m) => m.HelpAiComponent),
  },

  // Tournament routes
  {
    path: 'tournaments',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./tournaments/tournaments-list/tournaments-list').then(
        (m) => m.TournamentsListComponent,
      ),
  },
  {
    path: 'tournaments/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./tournaments/create-tournament/create-tournament').then(
        (m) => m.CreateTournamentComponent,
      ),
  },
  {
    path: 'tournaments/:id/manage',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./tournaments/tournament-manage/tournament-manage').then(
        (m) => m.TournamentManageComponent,
      ),
  },
  {
    // Public - no auth guard. Anyone with the link can view the schedule/rules.
    path: 'tournaments/:id',
    loadComponent: () =>
      import('./tournaments/tournament-public/tournament-public').then(
        (m) => m.TournamentPublicComponent,
      ),
  },

  {
    path: 'privacy',
    loadComponent: () =>
      import('./legal/privacy-policy/privacy-policy').then(
        (m) => m.PrivacyPolicyComponent,
      ),
  },

  { path: '**', redirectTo: '' },
];
