import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);

  loading = false;
  error = '';

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    this.http.post<{ accessToken?: string; token?: string }>(
      'http://localhost:3000/api/auth/login',
      this.form.getRawValue()
    ).subscribe({
      next: (res) => {
        const token = res.accessToken ?? res.token;

        if (token) {
          localStorage.setItem('token', token);
        }

        this.router.navigateByUrl('/requests');
      },
      error: (err) => {
        this.loading = false;
        this.error =
          err?.error?.message ||
          'Login failed. Please check your email and password.';
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
}