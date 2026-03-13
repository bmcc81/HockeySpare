import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { guestGuard } from './auth/guest.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./home/home/home').then(m => m.HomeComponent),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./auth/login/login').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./auth/register/register').then(m => m.RegisterComponent),
  },
  {
    path: 'requests',
    loadComponent: () =>
      import('./requests/request-list/request-list').then(m => m.RequestListComponent),
  },
  {
    path: 'requests/team/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./requests/team-request-create/team-request-create').then(
        m => m.TeamRequestCreateComponent
      ),
  },
  {
    path: 'requests/player/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./requests/player-offer-create/player-offer-create').then(
        m => m.PlayerOfferCreateComponent
      ),
  },
  {
    path: 'requests/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./requests/request-detail/request-detail').then(m => m.RequestDetailComponent),
  },
  {
    path: 'profile/player',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./profiles/player-profile/player-profile').then(m => m.PlayerProfileComponent),
  },
  {
    path: 'profile/team',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./profiles/team-profile/team-profile').then(m => m.TeamProfileComponent),
  },
  {
    path: 'messages',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./messaging/chat-list/chat-list').then(m => m.ChatListComponent),
  },
  {
    path: 'messages/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./messaging/chat-window/chat-window').then(m => m.ChatWindowComponent),
  },
  {
    path: 'my-bookings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./matches/my-bookings/my-bookings').then(m => m.MyBookingsComponent),
  },
  { path: '**', redirectTo: '' },
];