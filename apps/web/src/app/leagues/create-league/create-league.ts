import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LeaguesApiService } from '../../core/services/leagues-api.service';

@Component({
  selector: 'app-create-league',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create-league.html',
  styleUrl: './create-league.scss',
})
export class CreateLeagueComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly leaguesApi = inject(LeaguesApiService);

  saving = signal(false);
  error = signal<string | null>(null);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    season: [
      this.defaultUpcomingSeason(), [ Validators.required, Validators.pattern(/^\d{4}-\d{4}$/)],
    ],
  });

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const value = this.form.getRawValue();

    this.leaguesApi
      .create({
        name: value.name.trim(),
        season: value.season.trim(),
      })
      .subscribe({
        next: (league) => {
          this.saving.set(false);
          this.router.navigate(['/leagues', league.id]);
        },
        error: () => {
          this.error.set('Could not create league.');
          this.saving.set(false);
        },
      });
  }

  protected defaultUpcomingSeason(): string {
    const year = new Date().getFullYear();
    return `${year}-${year + 1}`;
  }
}