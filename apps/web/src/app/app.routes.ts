import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./home/home/home').then(m => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./auth/register/register').then(m => m.RegisterComponent),
  },
  {
    path: 'requests',
    loadComponent: () =>
      import('./requests/request-list/request-list').then(m => m.RequestListComponent),
  },
  {
    path: 'requests/:id',
    loadComponent: () =>
      import('./requests/request-detail/request-detail').then(m => m.RequestDetailComponent),
  },
  {
    path: 'requests/team/new',
    loadComponent: () =>
      import('./requests/team-request-create/team-request-create').then(m => m.TeamRequestCreateComponent),
  },
  {
    path: 'requests/player/new',
    loadComponent: () =>
      import('./requests/player-offer-create/player-offer-create').then(m => m.PlayerOfferCreateComponent),
  },

  {
    path: 'profile/player',
    loadComponent: () =>
      import('./profiles/player-profile/player-profile').then(m => m.PlayerProfileComponent),
  },
  {
    path: 'profile/team',
    loadComponent: () =>
      import('./profiles/team-profile/team-profile').then(m => m.TeamProfileComponent),
  },

  {
    path: 'messages',
    loadComponent: () =>
      import('./messaging/chat-list/chat-list').then(m => m.ChatListComponent),
  },
  {
    path: 'messages/:id',
    loadComponent: () =>
      import('./messaging/chat-window/chat-window').then(m => m.ChatWindowComponent),
  },

  {
    path: 'my-bookings',
    loadComponent: () =>
      import('./matches/my-bookings/my-bookings').then(m => m.MyBookingsComponent),
  },

  { path: '**', redirectTo: '' },
];
