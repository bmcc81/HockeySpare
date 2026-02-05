import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { combineLatest } from 'rxjs';
import { map, shareReplay, startWith } from 'rxjs/operators';

import { RequestApiService } from '../../core/services/request-api';
import {
  Position,
  SkillLevel,
  RequestType,
  SpareRequest,
  PlayerOffer,
  PlayerNeedsTeamRequest,
  TeamNeedsPlayerRequest,
} from '@hockeyspare/contracts';

type Option<T> = { label: string; value: T };

function humanize(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
function enumStringValues<T extends object>(e: T): string[] {
  return Object.values(e).filter((v): v is string => typeof v === 'string');
}

// ✅ type guards (no more casts)
const isTeamNeedsPlayer = (r: SpareRequest): r is TeamNeedsPlayerRequest =>
  r.type === RequestType.TEAM_NEEDS_PLAYER;

const isPlayerNeedsTeam = (r: SpareRequest): r is PlayerNeedsTeamRequest =>
  r.type === RequestType.PLAYER_NEEDS_TEAM;

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './request-list.html',
  styleUrls: ['./request-list.scss'],
})
export class RequestListComponent {
  private readonly api = inject(RequestApiService);

  // controls
  readonly searchCtrl = new FormControl<string>('', { nonNullable: true });
  readonly typeCtrl = new FormControl<RequestType | 'all'>('all', { nonNullable: true });
  readonly positionCtrl = new FormControl<Position | 'all'>('all', { nonNullable: true });
  readonly skillCtrl = new FormControl<SkillLevel | 'all'>('all', { nonNullable: true });

  readonly RequestType = RequestType;

  // template helpers (avoid union-property access in template)
  teamName(req: TeamNeedsPlayerRequest): string {
    return req.teamName;
  }

  playerName(x: PlayerNeedsTeamRequest | PlayerOffer): string {
    return x.playerName;
  }

  // options
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

  // data
  readonly requests$ = this.api.getRequests().pipe(shareReplay({ bufferSize: 1, refCount: true }));
  readonly offers$ = this.api.getPlayerOffers().pipe(shareReplay({ bufferSize: 1, refCount: true }));

  // view model
  readonly vm$ = combineLatest([
    this.requests$,
    this.offers$,
    this.searchCtrl.valueChanges.pipe(startWith(this.searchCtrl.value)),
    this.typeCtrl.valueChanges.pipe(startWith(this.typeCtrl.value)),
    this.positionCtrl.valueChanges.pipe(startWith(this.positionCtrl.value)),
    this.skillCtrl.valueChanges.pipe(startWith(this.skillCtrl.value)),
  ]).pipe(
    map(([requests, offers, search, type, position, skill]) => {
      const q = search.trim().toLowerCase();

      const matchesCommon = (x: {
        arena?: string;
        time?: string;
        notes?: string;
        payAmount?: number;
        position?: any;
        skillLevel?: any;
      }) => {
        const matchesSearch =
          !q ||
          (x.arena ?? '').toLowerCase().includes(q) ||
          (x.time ?? '').toLowerCase().includes(q) ||
          (x.notes ?? '').toLowerCase().includes(q) ||
          String(x.payAmount ?? '').includes(q) ||
          String(x.position ?? '').toLowerCase().includes(q) ||
          String(x.skillLevel ?? '').toLowerCase().includes(q);

        const matchesPosition = position === 'all' || x.position === position;
        const matchesSkill = skill === 'all' || x.skillLevel === skill;

        return matchesSearch && matchesPosition && matchesSkill;
      };

      const filteredRequests = requests.filter((r) => {
        const matchesType = type === 'all' || r.type === type;
        return matchesType && matchesCommon(r);
      });

      const showOffers = type === 'all' || type === RequestType.PLAYER_NEEDS_TEAM;
      const filteredOffers = showOffers ? offers.filter(matchesCommon) : [];

      const teamRequests = filteredRequests.filter(isTeamNeedsPlayer);     // TeamNeedsPlayerRequest[]
      const playerNeedRequests = filteredRequests.filter(isPlayerNeedsTeam); // PlayerNeedsTeamRequest[]

      return {
        requests: teamRequests,
        playerOffers: [...playerNeedRequests, ...filteredOffers], // (PlayerNeedsTeamRequest | PlayerOffer)[]
      };
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  clearFilters(): void {
    this.searchCtrl.setValue('');
    this.typeCtrl.setValue('all');
    this.positionCtrl.setValue('all');
    this.skillCtrl.setValue('all');
  }
}
