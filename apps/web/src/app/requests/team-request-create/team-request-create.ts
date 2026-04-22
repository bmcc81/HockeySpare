import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgbTimepickerModule, NgbTimeStruct } from '@ng-bootstrap/ng-bootstrap';
import { Position, SkillLevel, RequestType, type CreateRequestInput, } from '@hockeyspare/contracts';
import { RequestApiService } from '../../core/services/request-api';

@Component({
  selector: 'app-team-request-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbTimepickerModule, RouterLink],
  templateUrl: './team-request-create.html',
  styleUrl: './team-request-create.scss',
})
export class TeamRequestCreateComponent {
  private fb = inject(FormBuilder);
  private requestApi = inject(RequestApiService);
  private router = inject(Router);

  positions = Object.values(Position).filter((v): v is Position => typeof v === 'string');
  skillLevels = Object.values(SkillLevel).filter((v): v is SkillLevel => typeof v === 'string');

  loading = false;
  error = '';

  form = this.fb.group({
    teamName: ['', [Validators.required, Validators.maxLength(80)]],
    position: [Position.FORWARD as Position, Validators.required],
    skillLevel: [SkillLevel.INTERMEDIATE as SkillLevel, Validators.required],
    payAmount: [40, [Validators.required, Validators.min(0)]],
    arena: ['', Validators.required],
    arenaAddress: ['', [Validators.maxLength(220)]],
    time: [{ hour: 20, minute: 30, second: 0 } as NgbTimeStruct, Validators.required],
    date: ['', Validators.required],
    notes: [''],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    const raw = this.form.getRawValue();

    const payload = {
    type: RequestType.TEAM_NEEDS_PLAYER,
    playerName: null,
    teamName: raw.teamName ?? '',
    position: raw.position ?? Position.FORWARD,
    skillLevel: raw.skillLevel ?? SkillLevel.INTERMEDIATE,
    payAmount: raw.payAmount ?? 0,
    arena: raw.arena ?? '',
    arenaAddress: raw.arenaAddress ?? null,
    date: raw.date ?? '',
    time: this.formatTime(raw.time),
    notes: raw.notes ?? null,
  } satisfies CreateRequestInput;

    this.requestApi.createRequest(payload).subscribe({
      next: () => {
        this.router.navigateByUrl('/requests');
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to create team request.';
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  private formatTime(time: NgbTimeStruct | null): string {
    if (!time) return '';

    const hour12 = time.hour % 12 || 12;
    const minute = String(time.minute).padStart(2, '0');
    const period = time.hour >= 12 ? 'PM' : 'AM';

    return `${hour12}:${minute} ${period}`;
  }
}