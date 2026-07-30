import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Tournament } from '@hockeyspare/contracts';
import { TournamentsApiService } from '../../core/services/tournaments-api.service';

type TournamentTab = 'schedule' | 'rules' | 'register';

@Component({
  selector: 'app-tournament-public',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tournament-public.html',
})
export class TournamentPublicComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly tournamentsApi = inject(TournamentsApiService);

  tournamentId = this.route.snapshot.paramMap.get('id') ?? '';

  tournament = signal<Tournament | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  activeTab = signal<TournamentTab>('schedule');

  submittingRegistration = signal(false);
  registrationError = signal<string | null>(null);
  registrationSuccess = signal(false);

  registrationForm = this.fb.group({
    teamName: ['', Validators.required],
    division: [''],
    contactName: ['', Validators.required],
    contactEmail: ['', [Validators.required, Validators.email]],
    contactPhone: [''],
    notes: [''],
  });

  ngOnInit(): void {
    this.tournamentsApi.getPublic(this.tournamentId).subscribe({
      next: (tournament) => {
        this.tournament.set(tournament);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('This tournament could not be found.');
        this.loading.set(false);
      },
    });
  }

  setTab(tab: TournamentTab): void {
    this.activeTab.set(tab);
  }

  submitRegistration(): void {
    if (this.registrationForm.invalid || this.submittingRegistration()) {
      this.registrationForm.markAllAsTouched();
      return;
    }

    const value = this.registrationForm.getRawValue();

    this.submittingRegistration.set(true);
    this.registrationError.set(null);

    this.tournamentsApi
      .submitRegistration(this.tournamentId, {
        teamName: value.teamName.trim(),
        division: value.division.trim() || null,
        contactName: value.contactName.trim(),
        contactEmail: value.contactEmail.trim(),
        contactPhone: value.contactPhone.trim() || null,
        notes: value.notes.trim() || null,
      })
      .subscribe({
        next: () => {
          this.submittingRegistration.set(false);
          this.registrationSuccess.set(true);
          this.registrationForm.reset({
            teamName: '',
            division: '',
            contactName: '',
            contactEmail: '',
            contactPhone: '',
            notes: '',
          });
        },
        error: (err) => {
          this.registrationError.set(
            err?.error?.message || 'Could not submit your registration.',
          );
          this.submittingRegistration.set(false);
        },
      });
  }
}
