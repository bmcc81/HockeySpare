import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApi } from '../auth.api';
import { AuthStateService } from '../auth-state.service';

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
  private authState = inject(AuthStateService);
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

    const { email, password } = this.form.getRawValue();

    this.api.login({
      email: email.trim().toLowerCase(),
      password,
    }).subscribe({
      next: (res) => {
        this.authState.setSession(res);
        this.router.navigateByUrl('/requests');
      },
      error: (err) => {
        this.error =
          err?.error?.message || 'Login failed. Please check your email and password.';
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
}