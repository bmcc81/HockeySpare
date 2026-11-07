import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TournamentVolunteerShift } from '@hockeyspare/contracts';
import { I18nService } from '../../../core/i18n/i18n.service';
import { LocalDatePipe, TranslatePipe } from '../../../core/i18n/t.pipe';
import { TournamentsApiService } from '../../../core/services/tournaments-api.service';
import { groupVolunteerShifts } from '../volunteer-groups';

/** `datetime-local` inputs want "YYYY-MM-DDTHH:mm" in the browser's own time zone. */
function toLocalInputValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Organizer tools for volunteer shifts: open or hide sign-up for the public,
 * add and edit shifts, and put names on shifts (or take them off).
 */
@Component({
  selector: 'app-volunteer-manager',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe, LocalDatePipe],
  templateUrl: './volunteer-manager.html',
})
export class VolunteerManagerComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(TournamentsApiService);
  private readonly i18n = inject(I18nService);

  @Input({ required: true }) tournamentId!: string;
  /** Whether sign-up is open to the public (undefined is treated as open). */
  @Input() open: boolean | undefined = true;
  /** Emits the new state after the organizer opens or hides sign-up. */
  @Output() openChange = new EventEmitter<boolean>();

  shifts = signal<TournamentVolunteerShift[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  groups = computed(() => groupVolunteerShifts(this.shifts(), this.i18n.locale()));

  savingOpen = signal(false);

  saving = signal(false);
  deletingShiftId = signal<string | null>(null);
  removingSignupId = signal<string | null>(null);

  editingShiftId = signal<string | null>(null);
  addingNameShiftId = signal<string | null>(null);
  savingName = signal(false);

  shiftForm = this.fb.group({
    role: ['', Validators.required],
    description: [''],
    startsAt: ['', Validators.required],
    endsAt: ['', Validators.required],
    location: [''],
    capacity: [''],
  });

  editForm = this.fb.group({
    role: ['', Validators.required],
    description: [''],
    startsAt: ['', Validators.required],
    endsAt: ['', Validators.required],
    location: [''],
    capacity: [''],
  });

  nameForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', Validators.email],
    phone: [''],
  });

  get isOpen(): boolean {
    return this.open !== false;
  }

  ngOnInit(): void {
    this.load();
  }

  filled(shift: TournamentVolunteerShift): number {
    return shift.signups?.length ?? shift._count?.signups ?? 0;
  }

  private load(): void {
    this.api.listVolunteerShifts(this.tournamentId).subscribe({
      next: (shifts) => {
        this.shifts.set(shifts);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.i18n.t('Could not load the volunteer shifts.'));
        this.loading.set(false);
      },
    });
  }

  private fail(err: unknown, fallback: string): void {
    this.error.set((err as { error?: { message?: string } })?.error?.message || this.i18n.t(fallback));
  }

  toggleOpen(): void {
    const next = !this.isOpen;
    this.savingOpen.set(true);
    this.error.set(null);

    this.api.update(this.tournamentId, { volunteersOpen: next }).subscribe({
      next: () => {
        this.savingOpen.set(false);
        this.openChange.emit(next);
      },
      error: (err) => {
        this.fail(err, 'Could not change volunteer sign-up.');
        this.savingOpen.set(false);
      },
    });
  }

  addShift(): void {
    if (this.shiftForm.invalid || this.saving()) {
      this.shiftForm.markAllAsTouched();
      return;
    }

    const value = this.shiftForm.getRawValue();
    this.saving.set(true);
    this.error.set(null);

    this.api
      .createVolunteerShift(this.tournamentId, {
        role: value.role.trim(),
        description: value.description.trim() || null,
        startsAt: new Date(value.startsAt).toISOString(),
        endsAt: new Date(value.endsAt).toISOString(),
        location: value.location.trim() || null,
        capacity: value.capacity ? Number(value.capacity) : null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.shiftForm.reset({ role: '', description: '', startsAt: '', endsAt: '', location: '', capacity: '' });
          this.load();
        },
        error: (err) => {
          this.fail(err, 'Could not add this volunteer shift.');
          this.saving.set(false);
        },
      });
  }

  startEdit(shift: TournamentVolunteerShift): void {
    this.editingShiftId.set(shift.id);
    this.addingNameShiftId.set(null);
    this.editForm.reset({
      role: shift.role,
      description: shift.description ?? '',
      startsAt: toLocalInputValue(shift.startsAt),
      endsAt: toLocalInputValue(shift.endsAt),
      location: shift.location ?? '',
      capacity: shift.capacity ? String(shift.capacity) : '',
    });
  }

  cancelEdit(): void {
    this.editingShiftId.set(null);
  }

  saveEdit(shiftId: string): void {
    if (this.editForm.invalid || this.saving()) {
      this.editForm.markAllAsTouched();
      return;
    }

    const value = this.editForm.getRawValue();
    this.saving.set(true);
    this.error.set(null);

    this.api
      .updateVolunteerShift(this.tournamentId, shiftId, {
        role: value.role.trim(),
        description: value.description.trim(),
        startsAt: new Date(value.startsAt).toISOString(),
        endsAt: new Date(value.endsAt).toISOString(),
        location: value.location.trim(),
        capacity: value.capacity ? Number(value.capacity) : null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.editingShiftId.set(null);
          this.load();
        },
        error: (err) => {
          this.fail(err, 'Could not save this volunteer shift.');
          this.saving.set(false);
        },
      });
  }

  deleteShift(shift: TournamentVolunteerShift): void {
    if (
      this.filled(shift) > 0 &&
      !window.confirm(this.i18n.t('This shift has people on it. Remove it anyway?'))
    ) {
      return;
    }

    this.deletingShiftId.set(shift.id);
    this.error.set(null);

    this.api.deleteVolunteerShift(this.tournamentId, shift.id).subscribe({
      next: () => {
        this.deletingShiftId.set(null);
        this.load();
      },
      error: (err) => {
        this.fail(err, 'Could not remove this volunteer shift.');
        this.deletingShiftId.set(null);
      },
    });
  }

  startAddName(shiftId: string): void {
    this.addingNameShiftId.set(this.addingNameShiftId() === shiftId ? null : shiftId);
    this.editingShiftId.set(null);
    this.nameForm.reset({ name: '', email: '', phone: '' });
  }

  addName(shiftId: string): void {
    if (this.nameForm.invalid || this.savingName()) {
      this.nameForm.markAllAsTouched();
      return;
    }

    const value = this.nameForm.getRawValue();
    this.savingName.set(true);
    this.error.set(null);

    this.api
      .addVolunteerToShift(this.tournamentId, shiftId, {
        name: value.name.trim(),
        email: value.email.trim() || null,
        phone: value.phone.trim() || null,
      })
      .subscribe({
        next: () => {
          this.savingName.set(false);
          this.addingNameShiftId.set(null);
          this.load();
        },
        error: (err) => {
          this.fail(err, 'Could not add this name.');
          this.savingName.set(false);
        },
      });
  }

  removeSignup(shift: TournamentVolunteerShift, signupId: string): void {
    this.removingSignupId.set(signupId);
    this.error.set(null);

    this.api.removeVolunteerSignup(this.tournamentId, shift.id, signupId).subscribe({
      next: () => {
        this.removingSignupId.set(null);
        this.load();
      },
      error: (err) => {
        this.fail(err, 'Could not remove this name.');
        this.removingSignupId.set(null);
      },
    });
  }

  trackById(_index: number, item: { id: string }): string {
    return item.id;
  }
}
