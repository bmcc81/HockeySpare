import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApi } from '../auth.api';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private api = inject(AuthApi);
  private router = inject(Router);

  loading = false;
  error = '';

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    const { firstName, lastName, email, password } = this.form.getRawValue();

    this.api.login({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
      }).subscribe({
      next: (res) => {
        const token = res.accessToken;

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