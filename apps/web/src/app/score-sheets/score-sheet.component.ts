import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize, forkJoin, of, switchMap, timeout } from 'rxjs';
import {
  GameScoreSheetDto,
  ScoreSheetPlayerLineDto,
} from '@hockeyspare/contracts';
import { ScoreSheetsApiService } from '../core/services/score-sheets-api.service';

type ScoreSheetPlayerLineGroup = {
  teamId: string;
  teamName: string;
  lines: {
    line: ScoreSheetPlayerLineDto;
    index: number;
  }[];
};

@Component({
  selector: 'app-score-sheet',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './score-sheet.component.html',
})
export class ScoreSheetComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly scoreSheetsApi = inject(ScoreSheetsApiService);
  private readonly location = inject(Location);

  gameId = '';
  leagueId: string | null = null;
  teamId: string | null = null;

  loading = signal<boolean>(true);
  saving = false;
  finalizing = false;
  error = '';
  success = '';

  scoreSheet: GameScoreSheetDto | null = null;

  scoreForm = this.fb.group({
    teamPeriod1Score: [0, [Validators.required, Validators.min(0)]],
    teamPeriod2Score: [0, [Validators.required, Validators.min(0)]],
    teamPeriod3Score: [0, [Validators.required, Validators.min(0)]],
    teamOvertimeScore: [0, [Validators.required, Validators.min(0)]],

    opponentPeriod1Score: [0, [Validators.required, Validators.min(0)]],
    opponentPeriod2Score: [0, [Validators.required, Validators.min(0)]],
    opponentPeriod3Score: [0, [Validators.required, Validators.min(0)]],
    opponentOvertimeScore: [0, [Validators.required, Validators.min(0)]],

    teamScore: [0, [Validators.required, Validators.min(0)]],
    opponentScore: [0, [Validators.required, Validators.min(0)]],

    notes: [''],
  });

  linesForm = this.fb.group({
    lines: this.fb.array<FormGroup>([]),
  });

  get lineArray(): FormArray<FormGroup> {
    return this.linesForm.controls.lines as FormArray<FormGroup>;
  }

  get isFinalized(): boolean {
    return this.scoreSheet?.status === 'FINALIZED';
  }

  get canEdit(): boolean {
    return (
      !!this.scoreSheet?.id &&
      !this.isFinalized &&
      !this.saving &&
      !this.finalizing
    );
  }

  get canFinalize(): boolean {
    return (
      !!this.scoreSheet?.id &&
      !this.isFinalized &&
      !this.saving &&
      !this.finalizing &&
      this.linesForm.valid &&
      this.scoreForm.valid
    );
  }

  get canEditOpponentScore(): boolean {
    return this.canEdit && !this.scoreSheet?.game.opponentTeamId;
  }

  get groupedPlayerLines(): ScoreSheetPlayerLineGroup[] {
    if (!this.scoreSheet) {
      return [];
    }

    const groups = new Map<string, ScoreSheetPlayerLineGroup>();

    this.scoreSheet.playerLines.forEach((line, index) => {
      const teamId = line.member.teamId;
      const teamName =
        line.member.team?.name ??
        (teamId === this.scoreSheet?.teamId
          ? this.scoreSheet.team.name
          : null) ??
        'Unknown team';

      const group = groups.get(teamId);

      if (group) {
        group.lines.push({ line, index });
        return;
      }

      groups.set(teamId, {
        teamId,
        teamName,
        lines: [{ line, index }],
      });
    });

    return [...groups.values()];
  }

  ngOnInit(): void {
    this.scoreForm.valueChanges.subscribe(() => {
      this.syncScoreFromPeriods();
    });

    this.gameId = this.route.snapshot.paramMap.get('gameId') ?? '';
    this.leagueId = this.route.snapshot.queryParamMap.get('leagueId');
    this.teamId = this.route.snapshot.queryParamMap.get('teamId');

    if (!this.gameId) {
      this.loading.set(false);
      this.error = 'Game id was not found.';
      return;
    }

    this.loadScoreSheet();
  }

  goBack(): void {
    this.location.back();
  }

  loadScoreSheet(): void {
    this.loading.set(true);
    this.error = '';
    this.success = '';

    this.scoreSheetsApi
      .getByGame(this.gameId)
      .pipe(
        timeout(10000),
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: (scoreSheet) => {
          if (!scoreSheet.id) {
            this.createDraftScoreSheet();
            return;
          }

          this.setScoreSheet(scoreSheet);
        },
        error: (err) => {
          console.error('Scoresheet load failed', err);

          this.error =
            err?.error?.message ||
            err?.message ||
            'Could not load this scoresheet. Make sure the API is running and you are a League GM or Timekeeper.';
        },
      });
  }

  createDraftScoreSheet(): void {
    this.loading.set(true);
    this.error = '';
    this.success = '';

    this.scoreSheetsApi
      .createForGame(this.gameId, {
        teamScore: 0,
        opponentScore: 0,
        notes: '',
      })
      .pipe(
        timeout(10000),
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: (scoreSheet) => {
          this.setScoreSheet(scoreSheet);
        },
        error: (err) => {
          console.error('Scoresheet create failed', err);

          this.error =
            err?.error?.message ||
            err?.message ||
            'Could not create the scoresheet for this game.';
        },
      });
  }

  setScoreSheet(scoreSheet: GameScoreSheetDto): void {
    this.scoreSheet = scoreSheet;

    this.scoreForm.patchValue(
      {
        teamPeriod1Score: scoreSheet.teamPeriod1Score ?? 0,
        teamPeriod2Score: scoreSheet.teamPeriod2Score ?? 0,
        teamPeriod3Score: scoreSheet.teamPeriod3Score ?? 0,
        teamOvertimeScore: scoreSheet.teamOvertimeScore ?? 0,

        opponentPeriod1Score: scoreSheet.opponentPeriod1Score ?? 0,
        opponentPeriod2Score: scoreSheet.opponentPeriod2Score ?? 0,
        opponentPeriod3Score: scoreSheet.opponentPeriod3Score ?? 0,
        opponentOvertimeScore: scoreSheet.opponentOvertimeScore ?? 0,

        teamScore: scoreSheet.teamScore ?? 0,
        opponentScore: scoreSheet.opponentScore ?? 0,

        notes: scoreSheet.notes ?? '',
      },
      { emitEvent: false },
    );

    this.buildLineForms(scoreSheet.playerLines ?? []);

    if (this.isFinalized) {
      this.scoreForm.disable({ emitEvent: false });
      this.linesForm.disable({ emitEvent: false });
      return;
    }

    this.scoreForm.enable({ emitEvent: false });
    this.linesForm.enable({ emitEvent: false });
    this.syncScoreFromPeriods();
  }

  buildLineForms(lines: ScoreSheetPlayerLineDto[]): void {
    this.lineArray.clear();

    for (const line of lines) {
      const group = this.fb.group({
        id: [line.id],
        memberId: [line.memberId],
        gamesPlayed: [
          line.gamesPlayed ?? 1,
          [Validators.required, Validators.min(0)],
        ],
        goals: [line.goals ?? 0, [Validators.required, Validators.min(0)]],
        assists: [line.assists ?? 0, [Validators.required, Validators.min(0)]],
        penaltyMins: [
          line.penaltyMins ?? 0,
          [Validators.required, Validators.min(0)],
        ],
        plusMinus: [line.plusMinus ?? 0, Validators.required],
      });

      group.valueChanges.subscribe(() => {
        this.syncScoreWithPlayerGoals();
      });

      this.lineArray.push(group);
    }
  }

  saveScore(): void {
    if (!this.scoreSheet?.id || this.scoreForm.invalid || !this.canEdit) {
      this.scoreForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = '';
    this.success = '';

    this.scoreSheetsApi
      .updateScoreSheet(this.scoreSheet.id, this.getScorePayload())
      .subscribe({
        next: (scoreSheet) => {
          this.saving = false;
          this.success = 'Score saved.';
          this.setScoreSheet(scoreSheet);
        },
        error: (err) => {
          this.saving = false;
          this.error = err?.error?.message || 'Could not save the score.';
        },
      });
  }

  savePlayerLine(line: ScoreSheetPlayerLineDto, index: number): void {
    if (!this.scoreSheet?.id || !this.canEdit) {
      return;
    }

    const group = this.lineArray.at(index);

    if (!group || group.invalid) {
      group?.markAllAsTouched();
      return;
    }

    const raw = group.getRawValue();

    this.saving = true;
    this.error = '';
    this.success = '';

    this.scoreSheetsApi
      .updatePlayerLine(this.scoreSheet.id, line.id, {
        memberId: line.memberId,
        gamesPlayed: Number(raw.gamesPlayed ?? 0),
        goals: Number(raw.goals ?? 0),
        assists: Number(raw.assists ?? 0),
        penaltyMins: Number(raw.penaltyMins ?? 0),
      })
      .subscribe({
        next: (scoreSheet) => {
          this.saving = false;
          this.success = `Stats saved for ${line.member.displayName}.`;
          this.setScoreSheet(scoreSheet);
        },
        error: (err) => {
          this.saving = false;
          this.error =
            err?.error?.message ||
            `Could not save stats for ${line.member.displayName}.`;
        },
      });
  }

  deletePlayerLine(line: ScoreSheetPlayerLineDto): void {
    if (!this.scoreSheet?.id || !this.canEdit) {
      return;
    }

    const confirmed = window.confirm(
      `Remove ${line.member.displayName} from this scoresheet?`,
    );

    if (!confirmed) {
      return;
    }

    this.saving = true;
    this.error = '';
    this.success = '';

    this.scoreSheetsApi
      .deletePlayerLine(this.scoreSheet.id, line.id)
      .subscribe({
        next: (scoreSheet) => {
          this.saving = false;
          this.success = `${line.member.displayName} removed from scoresheet.`;
          this.setScoreSheet(scoreSheet);
        },
        error: (err) => {
          this.saving = false;
          this.error =
            err?.error?.message ||
            `Could not remove ${line.member.displayName}.`;
        },
      });
  }

  private saveAllPlayerLinesBeforeFinalize() {
    if (!this.scoreSheet?.id || this.scoreSheet.playerLines.length === 0) {
      return of([]);
    }

    const scoreSheetId = this.scoreSheet.id;

    const requests = this.scoreSheet.playerLines.map((line, index) => {
      const group = this.lineArray.at(index);
      const raw = group.getRawValue();

      return this.scoreSheetsApi.updatePlayerLine(scoreSheetId, line.id, {
        memberId: line.memberId,
        gamesPlayed: Number(raw.gamesPlayed ?? 0),
        goals: Number(raw.goals ?? 0),
        assists: Number(raw.assists ?? 0),
        penaltyMins: Number(raw.penaltyMins ?? 0),
        plusMinus: Number(raw.plusMinus ?? 0),
      });
    });

    return forkJoin(requests);
  }

  finalizeScoreSheet(): void {
    if (!this.scoreSheet?.id || this.isFinalized) {
      return;
    }

    if (this.linesForm.invalid || this.scoreForm.invalid) {
      this.linesForm.markAllAsTouched();
      this.scoreForm.markAllAsTouched();
      this.error = 'Fix the scoresheet errors before finalizing.';
      return;
    }

    this.syncScoreFromPeriods();

    const confirmed = window.confirm(
      'Finalize this scoresheet? This will save all player stats, update season stats, and lock the scoresheet.',
    );

    if (!confirmed) {
      return;
    }

    const scoreSheetId = this.scoreSheet.id;
    const raw = this.scoreForm.getRawValue();

    this.finalizing = true;
    this.error = '';
    this.success = '';

    this.saveAllPlayerLinesBeforeFinalize()
      .pipe(
        switchMap(() =>
          this.scoreSheetsApi.updateScoreSheet(scoreSheetId, {
            teamPeriod1Score: Number(raw.teamPeriod1Score ?? 0),
            teamPeriod2Score: Number(raw.teamPeriod2Score ?? 0),
            teamPeriod3Score: Number(raw.teamPeriod3Score ?? 0),
            teamOvertimeScore: Number(raw.teamOvertimeScore ?? 0),

            opponentPeriod1Score: Number(raw.opponentPeriod1Score ?? 0),
            opponentPeriod2Score: Number(raw.opponentPeriod2Score ?? 0),
            opponentPeriod3Score: Number(raw.opponentPeriod3Score ?? 0),
            opponentOvertimeScore: Number(raw.opponentOvertimeScore ?? 0),

            teamScore: Number(raw.teamScore ?? 0),
            opponentScore: Number(raw.opponentScore ?? 0),
            notes: raw.notes ?? '',
          }),
        ),
        switchMap(() => this.scoreSheetsApi.finalizeScoreSheet(scoreSheetId)),
      )
      .subscribe({
        next: (scoreSheet) => {
          this.finalizing = false;
          this.success = 'Scoresheet finalized. Player stats were updated.';
          this.setScoreSheet(scoreSheet);
        },
        error: (err) => {
          this.finalizing = false;
          this.error =
            err?.error?.message || 'Could not finalize this scoresheet.';
        },
      });
  }

  gameOpponent(): string {
    const game = this.scoreSheet?.game;

    if (!game) {
      return 'Opponent';
    }

    return game.opponentTeam?.name || game.opponent || 'Opponent';
  }

  finalizedByName(): string {
    const user = this.scoreSheet?.finalizedBy;

    if (!user) {
      return 'Unknown user';
    }

    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();

    return fullName || user.email;
  }

  trackByLineId(_: number, line: ScoreSheetPlayerLineDto): string {
    return line.id;
  }

  trackByLineGroup(_: number, group: ScoreSheetPlayerLineGroup): string {
    return group.teamId;
  }

  trackByGroupedLine(
    _: number,
    item: ScoreSheetPlayerLineGroup['lines'][number],
  ): string {
    return item.line.id;
  }

  private getLineGoalsForTeam(teamId: string): number {
    if (!this.scoreSheet) {
      return 0;
    }

    return this.scoreSheet.playerLines.reduce((total, line, index) => {
      if (line.member.teamId !== teamId) {
        return total;
      }

      const group = this.lineArray.at(index);
      const goals = Number(group?.get('goals')?.value ?? line.goals ?? 0);

      return total + goals;
    }, 0);
  }

  calculatedTeamScore(): number {
    if (!this.scoreSheet) {
      return 0;
    }

    return this.getLineGoalsForTeam(this.scoreSheet.teamId);
  }

  calculatedOpponentScore(): number {
    const opponentTeamId = this.scoreSheet?.game.opponentTeamId;

    if (!opponentTeamId) {
      return Number(this.scoreForm.controls.opponentScore.value ?? 0);
    }

    return this.getLineGoalsForTeam(opponentTeamId);
  }

  syncScoreWithPlayerGoals(): void {
    if (!this.scoreSheet || this.isFinalized) {
      return;
    }

    this.scoreForm.patchValue(
      {
        teamScore: this.calculatedTeamScore(),
        opponentScore: this.calculatedOpponentScore(),
      },
      {
        emitEvent: false,
      },
    );
  }

  syncScoreFromPeriods(): void {
    if (!this.scoreSheet || this.isFinalized) {
      return;
    }

    const raw = this.scoreForm.getRawValue();

    const teamScore =
      Number(raw.teamPeriod1Score ?? 0) +
      Number(raw.teamPeriod2Score ?? 0) +
      Number(raw.teamPeriod3Score ?? 0) +
      Number(raw.teamOvertimeScore ?? 0);

    const opponentScore =
      Number(raw.opponentPeriod1Score ?? 0) +
      Number(raw.opponentPeriod2Score ?? 0) +
      Number(raw.opponentPeriod3Score ?? 0) +
      Number(raw.opponentOvertimeScore ?? 0);

    this.scoreForm.patchValue(
      {
        teamScore,
        opponentScore,
      },
      { emitEvent: false },
    );
  }

  private getScorePayload() {
    this.syncScoreFromPeriods();

    const raw = this.scoreForm.getRawValue();

    return {
      teamPeriod1Score: Number(raw.teamPeriod1Score ?? 0),
      teamPeriod2Score: Number(raw.teamPeriod2Score ?? 0),
      teamPeriod3Score: Number(raw.teamPeriod3Score ?? 0),
      teamOvertimeScore: Number(raw.teamOvertimeScore ?? 0),

      opponentPeriod1Score: Number(raw.opponentPeriod1Score ?? 0),
      opponentPeriod2Score: Number(raw.opponentPeriod2Score ?? 0),
      opponentPeriod3Score: Number(raw.opponentPeriod3Score ?? 0),
      opponentOvertimeScore: Number(raw.opponentOvertimeScore ?? 0),

      teamScore: Number(raw.teamScore ?? 0),
      opponentScore: Number(raw.opponentScore ?? 0),

      notes: raw.notes ?? '',
    };
  }
}
