import { Injectable, computed, signal } from '@angular/core';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
}

export interface AuthSession {
  accessToken: string;
  user: AuthUser;
}

const TOKEN_KEY = 'token';
const USER_KEY = 'auth_user';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private tokenSignal = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private userSignal = signal<AuthUser | null>(this.readUser());

  token = this.tokenSignal.asReadonly();
  user = this.userSignal.asReadonly();
  isLoggedIn = computed(() => !!this.tokenSignal());

  setSession(session: AuthSession): void {
    localStorage.setItem(TOKEN_KEY, session.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    this.tokenSignal.set(session.accessToken);
    this.userSignal.set(session.user);
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.tokenSignal.set(null);
    this.userSignal.set(null);
  }

  private readUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }
}