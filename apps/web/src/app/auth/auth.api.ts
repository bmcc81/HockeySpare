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
  firstName: string; 
  lastName: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  user: { id: string; email: string; firstName: string | null; lastName: string | null };
  accessToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000';

  register(body: RegisterRequest) {
    return this.http.post<RegisterResponse>(`${this.baseUrl}/api/auth/register`, body);
  }

  login(body: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.baseUrl}/api/auth/login`, body);
  }
}