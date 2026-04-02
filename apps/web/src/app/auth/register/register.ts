import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthApi } from '../auth.api';

function passwordsMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (!password || !confirmPassword) {
      return null;
    }

    return password === confirmPassword ? null : { passwordMismatch: true };
  };
}

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private api = inject(AuthApi);
  private router = inject(Router);

  loading = false;
  error = '';

  form = this.fb.nonNullable.group(
    {
      firstName: [''],
      lastName: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: passwordsMatchValidator(),
    },
  );

  submit() {
    this.error = '';

    if (this.loading) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      if (this.form.hasError('passwordMismatch')) {
        this.error = 'Passwords do not match';
      }

      return;
    }

    const { firstName, lastName, email, password } = this.form.getRawValue();

    this.loading = true;

    this.api
      .register({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        email: email.trim().toLowerCase(),
        password,
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          localStorage.setItem('accessToken', res.accessToken);
          this.router.navigateByUrl('/login');
        },
        error: (err) => {
          const message = err?.error?.message;

          if (Array.isArray(message)) {
            this.error = message.join(', ');
          } else if (typeof message === 'string') {
            this.error = message;
          } else {
            this.error = 'Registration failed';
          }
        },
      });
  }
}