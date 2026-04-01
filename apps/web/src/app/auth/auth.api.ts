import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface RegisterResponse {
  user: { id: string; email: string; firstName?: string | null; lastName?: string | null };
  accessToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    createdAt: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private http = inject(HttpClient);
  private baseUrl = '/api';

  register(body: RegisterRequest) {
    return this.http.post<RegisterResponse>(`/api/auth/register`, body);
  }

  login(body: LoginRequest) {
    return this.http.post<AuthResponse>(`/api/auth/login`, body);
  }
}