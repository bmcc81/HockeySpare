import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TeamMember, MyTeamResponse, TeamService } from '../../core/services/team';

@Component({
  selector: 'app-my-team',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  templateUrl: './my-team.html',
  styleUrl: './my-team.scss',
})
export class MyTeamComponent implements OnInit {
  private fb = inject(FormBuilder);
  private teamApi = inject(TeamService);
  private cdr = inject(ChangeDetectorRef);

  loading = false;
  error = '';
  team: MyTeamResponse | null = null;

  teamForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
  });

  memberForm = this.fb.group({
    displayName: ['', Validators.required],
    email: ['', Validators.email],
    phone: [''],
    position: ['FORWARD'],
    memberType: ['REGULAR' as 'REGULAR' | 'SPARE', Validators.required],
    notifyByApp: [true],
    notifyByEmail: [false],
  });

  gameForm = this.fb.group({
    title: ['League Game', Validators.required],
    startsAt: ['', Validators.required],
    arena: [''],
    opponent: [''],
    notes: [''],
  });

  ngOnInit(): void {
    this.reload();
  }

  get regulars(): TeamMember[] {
    return this.team?.members.filter((m) => m.memberType === 'REGULAR') ?? [];
  }

  get spares(): TeamMember[] {
    return this.team?.members.filter((m) => m.memberType === 'SPARE') ?? [];
  }

  reload() {
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    this.teamApi.getMyTeam().subscribe({
      next: (team) => {
        this.team = {
          ...team,
          members: team?.members ?? [],
          games: team?.games ?? [],
        };

        this.teamForm.patchValue({
          name: team?.name ?? '',
        });

        this.loading = false;
        this.error = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Could not load team page:', err);
        this.error = 'Could not load your team.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  saveTeamName() {
    if (this.teamForm.invalid) {
      this.teamForm.markAllAsTouched();
      return;
    }

    const raw = this.teamForm.getRawValue();

    this.teamApi.updateMyTeam({
      name: raw.name ?? '',
    }).subscribe({
      next: () => this.reload(),
      error: () => {
        this.error = 'Could not save team name.';
      },
    });
  }

  addMember() {
    if (this.memberForm.invalid) {
      this.memberForm.markAllAsTouched();
      return;
    }

    const raw = this.memberForm.getRawValue();

    this.teamApi
      .addMember({
        displayName: raw.displayName ?? '',
        email: raw.email ?? '',
        phone: raw.phone ?? '',
        position: raw.position ?? 'FORWARD',
        memberType: raw.memberType ?? 'REGULAR',
        notifyByApp: !!raw.notifyByApp,
        notifyByEmail: !!raw.notifyByEmail,
      })
      .subscribe({
        next: () => {
          this.memberForm.reset({
            displayName: '',
            email: '',
            phone: '',
            position: 'FORWARD',
            memberType: 'REGULAR',
            notifyByApp: true,
            notifyByEmail: false,
          });
          this.reload();
        },
        error: () => {
          this.error = 'Could not add player.';
        },
      });
  }

  removeMember(memberId: string) {
    this.teamApi.removeMember(memberId).subscribe({
      next: () => this.reload(),
      error: () => {
        this.error = 'Could not remove player.';
      },
    });
  }

  createGame() {
    if (this.gameForm.invalid) {
      this.gameForm.markAllAsTouched();
      return;
    }

    const raw = this.gameForm.getRawValue();

    this.teamApi
      .createGame({
        title: raw.title ?? 'League Game',
        startsAt: new Date(raw.startsAt ?? '').toISOString(),
        arena: raw.arena ?? '',
        opponent: raw.opponent ?? '',
        notes: raw.notes ?? '',
      })
      .subscribe({
        next: () => {
          this.gameForm.reset({
            title: 'League Game',
            startsAt: '',
            arena: '',
            opponent: '',
            notes: '',
          });
          this.reload();
        },
        error: () => {
          this.error = 'Could not create game.';
        },
      });
  }

  notifyGame(gameId: string) {
    this.teamApi.notifyGame(gameId).subscribe({
      next: () => this.reload(),
      error: () => {
        this.error = 'Could not send notifications.';
      },
    });
  }
}