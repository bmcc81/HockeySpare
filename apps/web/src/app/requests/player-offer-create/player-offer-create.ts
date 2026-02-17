import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Position, SkillLevel, RequestType } from '@hockeyspare/contracts';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-player-offer-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './player-offer-create.html',
})
export class PlayerOfferCreateComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);

  // If these are TS enums, Object.values can include numbers too; filter to strings.
  positions = Object.values(Position).filter((v): v is Position => typeof v === 'string');
  skillLevels = Object.values(SkillLevel).filter((v): v is SkillLevel => typeof v === 'string');

  form = this.fb.nonNullable.group({
    position: [Position.FORWARD, Validators.required],
    skillLevel: [SkillLevel.INTERMEDIATE, Validators.required],
    payAmount: [20, [Validators.required, Validators.min(0)]],
    arena: ['', Validators.required],
    time: ['', Validators.required],
    notes: [''],
  });

  submit() {
    if (this.form.invalid) return;

    const payload = {
      ...this.form.getRawValue(),
      type: RequestType.PLAYER_NEEDS_TEAM, // ✅ this makes it show under "Player Offers"
    };

    this.http.post('http://localhost:3000/api/requests', payload).subscribe({
      next: (res) => {
        console.log('Created offer:', res);
        this.router.navigateByUrl('/requests');
      },
      error: (err) => console.error(err),
    });
  }
}
