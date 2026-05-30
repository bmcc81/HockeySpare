import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgbTimepickerModule, NgbTimeStruct } from '@ng-bootstrap/ng-bootstrap';
import {
  Position,
  SkillLevel,
  RequestType,
  type CreateRequestInput,
  type LeagueDto,
} from '@hockeyspare/contracts';
import { catchError, forkJoin, of } from 'rxjs';
import { RequestApiService } from '../../core/services/request-api';
import { LeaguesApiService } from '../../core/services/leagues-api.service';
import { TeamService } from '../../core/services/team';
import { AiMessageService } from '../../core/services/ai-message.service';

type TeamOption = {
  id: string;
  name: string;
  source: 'MY_TEAM' | 'LEAGUE';
};

@Component({
  selector: 'app-team-request-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbTimepickerModule, RouterLink],
  templateUrl: './team-request-create.html',
  styleUrl: './team-request-create.scss',
})
export class TeamRequestCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private aiMessageService = inject(AiMessageService);
  private requestApi = inject(RequestApiService);
  private leaguesApi = inject(LeaguesApiService);
  private teamApi = inject(TeamService);
  private router = inject(Router);

  positions = Object.values(Position).filter(
    (v): v is Position => typeof v === 'string',
  );

  skillLevels = Object.values(SkillLevel).filter(
    (v): v is SkillLevel => typeof v === 'string',
  );

  teams: TeamOption[] = [];
  teamsLoading = false;
  teamsError = '';

  loading = false;
  error = '';
  loadingAiMessage = false;
  aiError = '';
  aiTitle = '';
  missingFields: string[] = [];

  form = this.fb.group({
    teamName: ['', [Validators.required, Validators.maxLength(80)]],
    playersNeeded: [
      1,
      [Validators.required, Validators.min(1), Validators.max(10)],
    ],
    position: [Position.FORWARD as Position, Validators.required],
    skillLevel: [SkillLevel.INTERMEDIATE as SkillLevel, Validators.required],
    payAmount: [40, [Validators.required, Validators.min(0)]],
    arena: ['', Validators.required],
    arenaAddress: ['', [Validators.maxLength(220)]],
    time: [
      { hour: 20, minute: 30, second: 0 } as NgbTimeStruct,
      Validators.required,
    ],
    date: ['', Validators.required],
    notes: [''],
  });

  ngOnInit(): void {
    setTimeout(() => {
      this.loadExistingTeams();
    });
  }

  private loadExistingTeams(): void {
    this.teamsLoading = true;
    this.teamsError = '';

    forkJoin({
      myTeam: this.teamApi.getMyTeam().pipe(catchError(() => of(null))),
      leagues: this.leaguesApi
        .list()
        .pipe(catchError(() => of([] as LeagueDto[]))),
    }).subscribe({
      next: ({ myTeam, leagues }) => {
        const teamMap = new Map<string, TeamOption>();

        if (myTeam?.id && myTeam?.name) {
          teamMap.set(this.normalizeTeamName(myTeam.name), {
            id: myTeam.id,
            name: myTeam.name,
            source: 'MY_TEAM',
          });
        }

        for (const league of leagues) {
          for (const team of league.teams ?? []) {
            if (!team.id || !team.name) continue;

            const key = this.normalizeTeamName(team.name);

            if (!teamMap.has(key)) {
              teamMap.set(key, {
                id: team.id,
                name: team.name,
                source: 'LEAGUE',
              });
            }
          }
        }

        this.teams = [...teamMap.values()].sort((a, b) =>
          a.name.localeCompare(b.name),
        );

        if (this.teams.length === 1 && !this.form.controls.teamName.value) {
          this.form.controls.teamName.setValue(this.teams[0].name);
        }

        this.teamsLoading = false;
      },
      error: () => {
        this.teams = [];
        this.teamsError = 'Could not load your teams.';
        this.teamsLoading = false;
      },
    });
  }

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
      arenaAddress: raw.arenaAddress?.trim() || null,
      date: raw.date ?? '',
      time: this.formatTime(raw.time),
      notes: raw.notes?.trim() || null,
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

  private normalizeTeamName(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/^the\s+/, '')
      .replace(/\s+/g, ' ');
  }

  generateMessage(): void {
    this.aiError = '';
    this.aiTitle = '';
    this.missingFields = [];

    const requiredControls = [
      'position',
      'skillLevel',
      'playersNeeded',
      'date',
      'time',
      'arena',
    ] as const;

    for (const controlName of requiredControls) {
      this.form.controls[controlName].markAsTouched();
    }

    const hasInvalidAiFields = requiredControls.some(
      (controlName) => this.form.controls[controlName].invalid,
    );

    if (hasInvalidAiFields) {
      this.aiError =
        'Fill in the position, skill level, date, time, and arena before generating a message.';
      return;
    }

    const raw = this.form.getRawValue();

    const payload = {
      position: raw.position ?? Position.FORWARD,
      playersNeeded: Number(raw.playersNeeded ?? 1),
      date: raw.date ?? '',
      time: this.formatTime(raw.time),
      arena: raw.arena?.trim() ?? '',
      location: raw.arenaAddress?.trim() || raw.arena?.trim() || '',
      skillLevel: raw.skillLevel ?? SkillLevel.INTERMEDIATE,
      notes: raw.notes?.trim() || undefined,
    };

    this.loadingAiMessage = true;

    this.aiMessageService.generateSpareMessage(payload).subscribe({
      next: (result) => {
        this.aiTitle = result.title;
        this.missingFields = result.missingFields ?? [];

        this.form.controls.notes.setValue(result.message);
        this.form.controls.notes.markAsDirty();
      },
      error: (err) => {
        this.aiError =
          err?.error?.message ||
          'Could not generate message. Please try again.';
        this.loadingAiMessage = false;
      },
      complete: () => {
        this.loadingAiMessage = false;
      },
    });
  }
}
