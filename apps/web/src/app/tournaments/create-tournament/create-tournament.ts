import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TournamentsApiService } from '../../core/services/tournaments-api.service';

@Component({
  selector: 'app-create-tournament',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create-tournament.html',
})
export class CreateTournamentComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly tournamentsApi = inject(TournamentsApiService);

  saving = signal(false);
  error = signal<string | null>(null);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    rules: [''],
    startDate: [''],
    endDate: [''],
  });

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const value = this.form.getRawValue();

    this.tournamentsApi
      .create({
        name: value.name.trim(),
        description: value.description.trim() || null,
        rules: value.rules.trim() || null,
        startDate: value.startDate || null,
        endDate: value.endDate || null,
      })
      .subscribe({
        next: (tournament) => {
          this.saving.set(false);
          this.router.navigate(['/tournaments', tournament.id, 'manage']);
        },
        error: () => {
          this.error.set('Could not create tournament.');
          this.saving.set(false);
        },
      });
  }
}
