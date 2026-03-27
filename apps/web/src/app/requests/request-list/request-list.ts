import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { combineLatest, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, shareReplay, startWith } from 'rxjs/operators';

import { RequestApiService } from '../../core/services/request-api';
import { InViewDirective } from '../../shared/directives/in-view.directive';

import { PlayerNeedsTeamRequest, PlayerOffer, Position, RequestType, SkillLevel, SpareRequest, TeamNeedsPlayerRequest } from '@hockeyspare/contracts';

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, InViewDirective],
  templateUrl: './request-list.html',
  styleUrls: ['./request-list.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestListComponent {
  private readonly api = inject(RequestApiService);

  readonly RequestType = RequestType;

  readonly searchCtrl = new FormControl('', { nonNullable: true });
  readonly typeCtrl = new FormControl<RequestType | 'all'>('all', { nonNullable: true });
  readonly positionCtrl = new FormControl<Position | 'all'>('all', { nonNullable: true });
  readonly skillCtrl = new FormControl<SkillLevel | 'all'>('all', { nonNullable: true });

  readonly typeOptions = [
    { label: 'All types', value: 'all' as const },
    ...Object.values(RequestType)
      .filter((value): value is RequestType => typeof value === 'string')
      .map((value) => ({
        label: value.replace(/_/g, ' '),
        value,
      })),
  ];

  readonly positionOptions = [
    { label: 'All positions', value: 'all' as const },
    ...Object.values(Position)
      .filter((value): value is Position => typeof value === 'string')
      .map((value) => ({
        label: value.replace(/_/g, ' '),
        value,
      })),
  ];

  readonly skillOptions = [
    { label: 'All skill', value: 'all' as const },
    ...Object.values(SkillLevel)
      .filter((value): value is SkillLevel => typeof value === 'string')
      .map((value) => ({
        label: value.replace(/_/g, ' '),
        value,
      })),
  ];

  readonly requests$ = this.api.getRequests().pipe(
    catchError((error) => {
      console.error('Failed to load requests', error);
      return of([] as SpareRequest[]);
    }),
    shareReplay(1),
  );

  readonly offers$ = this.api.getPlayerOffers().pipe(
    catchError((error) => {
      console.error('Failed to load player offers', error);
      return of([] as PlayerOffer[]);
    }),
    shareReplay(1),
  );

  readonly vm$ = combineLatest([
    this.requests$.pipe(startWith([] as SpareRequest[])),
    this.offers$.pipe(startWith([] as PlayerOffer[])),
    this.searchCtrl.valueChanges.pipe(
      startWith(this.searchCtrl.value),
      debounceTime(150),
      map((value) => value.trim().toLowerCase()),
      distinctUntilChanged(),
    ),
    this.typeCtrl.valueChanges.pipe(startWith(this.typeCtrl.value), distinctUntilChanged()),
    this.positionCtrl.valueChanges.pipe(startWith(this.positionCtrl.value), distinctUntilChanged()),
    this.skillCtrl.valueChanges.pipe(startWith(this.skillCtrl.value), distinctUntilChanged()),
  ]).pipe(
    map(([requests, offers, search, type, position, skill]) => {
      const filteredRequests = requests.filter((request) => {
        const matchesType = type === 'all' || request.type === type;
        return matchesType && this.matchesCommon(request, search, position, skill);
      });

      const filteredOffers =
        type === 'all' || type === RequestType.PLAYER_NEEDS_TEAM
          ? offers.filter((offer) => this.matchesCommon(offer, search, position, skill))
          : [];

      return {
        requests: filteredRequests.filter(
          (request): request is TeamNeedsPlayerRequest =>
            request.type === RequestType.TEAM_NEEDS_PLAYER,
        ),
        playerOffers: [
          ...filteredRequests.filter(
            (request): request is PlayerNeedsTeamRequest =>
              request.type === RequestType.PLAYER_NEEDS_TEAM,
          ),
          ...filteredOffers,
        ],
      };
    }),
    shareReplay(1),
  );

  clearFilters(): void {
    this.searchCtrl.setValue('');
    this.typeCtrl.setValue('all');
    this.positionCtrl.setValue('all');
    this.skillCtrl.setValue('all');
  }

  teamName(request: TeamNeedsPlayerRequest): string {
    return request.teamName ?? '';
  }

  playerName(item: PlayerNeedsTeamRequest | PlayerOffer): string {
    return item.playerName ?? '';
  }

  arenaAddr(item: { arenaAddress?: string | null }): string | undefined {
    return item.arenaAddress ?? undefined;
  }

  mapsUrl(arena?: string | null, address?: string | null): string {
    const query = [arena, address].filter((value): value is string => !!value?.trim()).join(', ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  trackById(_: number, item: { id: number | string }): number | string {
    return item.id;
  }

  private matchesCommon(
    item: {
      arena?: string | null;
      arenaAddress?: string | null;
      time?: string | null;
      notes?: string | null;
      payAmount?: number | null;
      position?: Position | null;
      skillLevel?: SkillLevel | null;
      status?: string | null;
    },
    search: string,
    position: Position | 'all',
    skill: SkillLevel | 'all',
  ): boolean {
    const matchesSearch =
      !search ||
      this.includes(item.arena, search) ||
      this.includes(item.arenaAddress, search) ||
      this.includes(item.time, search) ||
      this.includes(item.notes, search) ||
      this.includes(item.position, search) ||
      this.includes(item.skillLevel, search) ||
      this.includes(item.status, search) ||
      this.includes(item.payAmount, search);

    const matchesPosition = position === 'all' || item.position === position;
    const matchesSkill = skill === 'all' || item.skillLevel === skill;

    return matchesSearch && matchesPosition && matchesSkill;
  }

  private includes(value: unknown, search: string): boolean {
    return String(value ?? '').toLowerCase().includes(search);
  }
}