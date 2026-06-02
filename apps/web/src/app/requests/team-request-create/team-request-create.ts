import { Component, OnInit, inject, signal } from '@angular/core';
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

  teams = signal<TeamOption[]>([]);
  teamsLoading = signal(false);
  teamsError = signal('');
  loading = false;
  error = '';

  aiError = '';
  aiTitle = '';
  missingFields: string[] = [];

  generatingAiMessage = signal(false);

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
    this.loadExistingTeams();
  }

  private loadExistingTeams(): void {
    this.teamsLoading.set(true);
    this.teamsError.set('');

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

        const sortedTeams = [...teamMap.values()].sort((a, b) =>
          a.name.localeCompare(b.name),
        );

        this.teams.set(sortedTeams);

        if (sortedTeams.length === 1 && !this.form.controls.teamName.value) {
          this.form.controls.teamName.setValue(sortedTeams[0].name);
        }

        this.teamsLoading.set(false);
      },
      error: () => {
        this.teams.set([]);
        this.teamsError.set('Could not load your teams.');
        this.teamsLoading.set(false);
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

  generateAiMessage(): void {
    const value = this.form.getRawValue();

    this.generatingAiMessage.set(true);
    this.aiError = '';
    this.aiTitle = '';
    this.missingFields = [];

    const notesParts = [
      value.notes?.trim() || '',
      value.payAmount ? `Pay amount: $${value.payAmount}` : '',
    ].filter(Boolean);

    this.aiMessageService
      .generateSpareMessage({
        teamName: value.teamName ?? '',
        position: value.position ?? Position.FORWARD,
        playersNeeded: Number(value.playersNeeded || 1),
        date: value.date ?? '',
        time: this.formatTime(value.time),
        arena: value.arena ?? '',
        location: value.arenaAddress ?? '',
        skillLevel: value.skillLevel ?? SkillLevel.INTERMEDIATE,
        notes: notesParts.join('\n'),
      })
      .subscribe({
        next: (response) => {
          this.aiTitle = response.title;
          this.missingFields = response.missingFields ?? [];

          this.form.patchValue({
            notes: response.message,
          });

          this.generatingAiMessage.set(false);
        },
        error: () => {
          this.aiError = 'Could not generate a message.';
          this.generatingAiMessage.set(false);
        },
      });
  }
}
