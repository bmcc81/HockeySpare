import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Position, SkillLevel } from '@hockeyspare/contracts';
import { Router } from '@angular/router';
import { NgbTimepickerModule, NgbTimeStruct } from '@ng-bootstrap/ng-bootstrap';
import { RequestApiService } from 'src/app/core/services/request-api';

@Component({
  selector: 'app-player-offer-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbTimepickerModule],
  templateUrl: './player-offer-create.html',
  styleUrl: './player-offer-create.scss',
})
export class PlayerOfferCreateComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private requestApi = inject(RequestApiService);

  positions = Object.values(Position).filter((v): v is Position => typeof v === 'string');
  skillLevels = Object.values(SkillLevel).filter((v): v is SkillLevel => typeof v === 'string');

  form = this.fb.group({
    playerName: ['', [Validators.required, Validators.maxLength(80)]],
    position: [Position.FORWARD as Position, Validators.required],
    skillLevel: [SkillLevel.INTERMEDIATE as SkillLevel, Validators.required],
    payAmount: [20, [Validators.required, Validators.min(0)]],
    arena: ['', Validators.required],
    arenaAddress: ['', [Validators.maxLength(220)]],
    date: ['', Validators.required],
    time: [{ hour: 20, minute: 30, second: 0 } as NgbTimeStruct, Validators.required],
    notes: [''],
  });

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    const payload = {
      playerName: raw.playerName ?? '',
      position: raw.position ?? Position.FORWARD,
      skillLevel: raw.skillLevel ?? SkillLevel.INTERMEDIATE,
      payAmount: raw.payAmount ?? 0,
      arena: raw.arena ?? '',
      arenaAddress: raw.arenaAddress ?? '',
      notes: raw.notes ?? '',
      date: raw.date ?? '',
      time: this.formatTime(raw.time),
    };

    this.requestApi.createPlayerOffer(payload).subscribe({
      next: (res) => {
        console.log('Created offer:', res);
        this.router.navigateByUrl('/requests');
      },
      error: (err) => console.error(err.error),
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