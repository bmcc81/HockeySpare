import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { combineLatest, Observable } from 'rxjs';
import { map, shareReplay, startWith } from 'rxjs/operators';

import { RequestApiService } from '../../core/services/request-api';
import { Position, RequestType, SkillLevel, SpareRequest } from '@hockeyspare/contracts';

type Option<T> = { label: string; value: T };

function humanize(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function enumStringValues<T extends object>(e: T): string[] {
  return Object.values(e).filter((v): v is string => typeof v === 'string');
}

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './request-list.html',
  styleUrls: ['./request-list.scss'],
})
export class RequestListComponent {
  // Canonical controls
  readonly searchCtrl = new FormControl<string>('', { nonNullable: true });
  readonly typeCtrl = new FormControl<RequestType | 'all'>('all', { nonNullable: true });
  readonly positionCtrl = new FormControl<Position | 'all'>('all', { nonNullable: true });
  readonly skillCtrl = new FormControl<SkillLevel | 'all'>('all', { nonNullable: true });

  // Template aliases (so your HTML doesn’t change)
  readonly q = this.searchCtrl;
  readonly type = this.typeCtrl;
  readonly position = this.positionCtrl;
  readonly skill = this.skillCtrl;

  // Options used by template
  readonly typeOptions: Array<Option<RequestType | 'all'>> = [
    { label: 'All types', value: 'all' },
    ...enumStringValues(RequestType).map((v) => ({ label: humanize(v), value: v as RequestType })),
  ];

  readonly positionOptions: Array<Option<Position | 'all'>> = [
    { label: 'All positions', value: 'all' },
    ...enumStringValues(Position).map((v) => ({ label: humanize(v), value: v as Position })),
  ];

  readonly skillOptions: Array<Option<SkillLevel | 'all'>> = [
    { label: 'All skill', value: 'all' },
    ...enumStringValues(SkillLevel).map((v) => ({ label: humanize(v), value: v as SkillLevel })),
  ];

  readonly requests$: Observable<SpareRequest[]>;
  readonly filteredRequests$: Observable<SpareRequest[]>;

  // Optional: expose enum for strict template comparisons
  readonly RequestType = RequestType;

  constructor(private readonly api: RequestApiService) {
    this.requests$ = this.api.getAll().pipe(shareReplay({ bufferSize: 1, refCount: true }));

    this.filteredRequests$ = combineLatest([
      this.requests$,
      this.searchCtrl.valueChanges.pipe(startWith(this.searchCtrl.value)),
      this.typeCtrl.valueChanges.pipe(startWith(this.typeCtrl.value)),
      this.positionCtrl.valueChanges.pipe(startWith(this.positionCtrl.value)),
      this.skillCtrl.valueChanges.pipe(startWith(this.skillCtrl.value)),
    ]).pipe(
      map(([requests, search, type, position, skill]) => {
        const q = search.trim().toLowerCase();

        return requests.filter((r) => {
          const matchesSearch =
            !q ||
            (r.arena ?? '').toLowerCase().includes(q) ||
            (r.time ?? '').toLowerCase().includes(q) ||
            (r.notes ?? '').toLowerCase().includes(q) ||
            String(r.payAmount ?? '').includes(q) ||
            String(r.type ?? '').toLowerCase().includes(q) ||
            String(r.position ?? '').toLowerCase().includes(q) ||
            String(r.skillLevel ?? '').toLowerCase().includes(q);

          const matchesType = type === 'all' || r.type === type;
          const matchesPosition = position === 'all' || r.position === position;
          const matchesSkill = skill === 'all' || r.skillLevel === skill;

          return matchesSearch && matchesType && matchesPosition && matchesSkill;
        });
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  clearFilters(): void {
    this.searchCtrl.setValue('');
    this.typeCtrl.setValue('all');
    this.positionCtrl.setValue('all');
    this.skillCtrl.setValue('all');
  }
}
