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
import { finalize, timeout, forkJoin, switchMap } from 'rxjs';
import {
  GameScoreSheetDto,
  ScoreSheetPlayerLineDto,
  ScoreSheetsApiService,
} from '../core/services/score-sheets-api.service';

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

  ngOnInit(): void {
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

    this.scoreForm.patchValue({
      teamScore: scoreSheet.teamScore ?? 0,
      opponentScore: scoreSheet.opponentScore ?? 0,
      notes: scoreSheet.notes ?? '',
    });

    this.buildLineForms(scoreSheet.playerLines ?? []);

    if (this.isFinalized) {
      this.scoreForm.disable();
      this.linesForm.disable();
    } else {
      this.scoreForm.enable();
      this.linesForm.enable();
    }
  }

  buildLineForms(lines: ScoreSheetPlayerLineDto[]): void {
    this.lineArray.clear();

    for (const line of lines) {
      this.lineArray.push(
        this.fb.group({
          id: [line.id],
          memberId: [line.memberId],
          gamesPlayed: [
            line.gamesPlayed ?? 1,
            [Validators.required, Validators.min(0)],
          ],
          goals: [line.goals ?? 0, [Validators.required, Validators.min(0)]],
          assists: [
            line.assists ?? 0,
            [Validators.required, Validators.min(0)],
          ],
          penaltyMins: [
            line.penaltyMins ?? 0,
            [Validators.required, Validators.min(0)],
          ],
        }),
      );
    }
  }

  saveScore(): void {
    if (!this.scoreSheet?.id || this.scoreForm.invalid || this.isFinalized) {
      this.scoreForm.markAllAsTouched();
      return;
    }

    const raw = this.scoreForm.getRawValue();

    this.saving = true;
    this.error = '';
    this.success = '';

    this.scoreSheetsApi
      .updateScoreSheet(this.scoreSheet.id, {
        teamScore: Number(raw.teamScore ?? 0),
        opponentScore: Number(raw.opponentScore ?? 0),
        notes: raw.notes ?? '',
      })
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
    if (!this.scoreSheet?.id || this.isFinalized) {
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
    if (!this.scoreSheet?.id || this.isFinalized) {
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
      return forkJoin([]);
    }

    const requests = this.scoreSheet.playerLines.map((line, index) => {
      const group = this.lineArray.at(index);
      const raw = group.getRawValue();

      return this.scoreSheetsApi.updatePlayerLine(
        this.scoreSheet!.id!,
        line.id,
        {
          memberId: line.memberId,
          gamesPlayed: Number(raw.gamesPlayed ?? 0),
          goals: Number(raw.goals ?? 0),
          assists: Number(raw.assists ?? 0),
          penaltyMins: Number(raw.penaltyMins ?? 0),
        },
      );
    });

    return forkJoin(requests);
  }

  finalizeScoreSheet(): void {
    if (!this.scoreSheet?.id || this.isFinalized) {
      return;
    }

    const confirmed = window.confirm(
      'Finalize this scoresheet? This will save all player stats, update season stats, and lock the scoresheet.',
    );

    if (!confirmed) {
      return;
    }

    this.finalizing = true;
    this.error = '';
    this.success = '';

    this.saveAllPlayerLinesBeforeFinalize()
      .pipe(switchMap(() => this.scoreSheetsApi.finalize(this.scoreSheet!.id!)))
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
}
