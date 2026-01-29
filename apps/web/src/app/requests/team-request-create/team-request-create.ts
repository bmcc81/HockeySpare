import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RequestApiService } from '../../core/services/request-api';

@Component({
  selector: 'app-team-request-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './team-request-create.html',
  styleUrl: './team-request-create.scss',
})
export class TeamRequestCreateComponent {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    type: ['team_needs_player', Validators.required],
    position: ['goalie', Validators.required],
    skillLevel: ['intermediate', Validators.required],
    payAmount: [40, [Validators.required, Validators.min(0), Validators.max(500)]],
    arena: ['', Validators.required],
    time: ['', Validators.required],
    notes: [''],
  });

  saving = false;
  error: string | null = null;

  constructor(
    private api: RequestApiService,
    private router: Router
  ) {}

  submit() {
    this.error = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;

    this.api.create(this.form.getRawValue() as any).subscribe({
      next: () => this.router.navigateByUrl('/requests'),
      error: (err) => {
        this.error = err?.error?.message ?? 'Failed to create request';
        this.saving = false;
      },
    });
  }
}
