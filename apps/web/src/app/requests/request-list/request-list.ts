// src/app/requests/request-list/request-list.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { combineLatest } from 'rxjs';
import { map, shareReplay, startWith } from 'rxjs/operators';

import { RequestApiService } from '../../core/services/request-api';
import { InViewDirective } from '../../shared/directives/in-view.directive';

import {
  PlayerNeedsTeamRequest,
  PlayerOffer,
  Position,
  RequestType,
  SkillLevel,
  SpareRequest,
  TeamNeedsPlayerRequest,
} from '@hockeyspare/contracts';

type Option<T> = {
  label: string;
  value: T;
};

type Maybe<T> = T | null | undefined;

/**
 * PlayerOffer may lag behind the API shape in the shared contracts.
 * This local type keeps the component safe until the contract is updated.
 */
type PlayerOfferView = PlayerOffer & {
  playerName?: Maybe<string>;
  arena?: Maybe<string>;
  arenaAddress?: Maybe<string>;
  time?: Maybe<string>;
  notes?: Maybe<string>;
  payAmount?: Maybe<number>;
  position?: Maybe<Position>;
  skillLevel?: Maybe<SkillLevel>;
  status?: Maybe<string>;
};

type PlayerSideItem = PlayerNeedsTeamRequest | PlayerOfferView;

type FilterableItem = {
  arena?: Maybe<string>;
  arenaAddress?: Maybe<string>;
  time?: Maybe<string>;
  notes?: Maybe<string>;
  payAmount?: Maybe<number>;
  position?: Maybe<Position>;
  skillLevel?: Maybe<SkillLevel>;
  status?: Maybe<string>;
};

function humanize(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function enumStringValues<T extends object>(enumObj: T): string[] {
  return Object.values(enumObj).filter((value): value is string => typeof value === 'string');
}

const isTeamNeedsPlayer = (request: SpareRequest): request is TeamNeedsPlayerRequest =>
  request.type === RequestType.TEAM_NEEDS_PLAYER;

const isPlayerNeedsTeam = (request: SpareRequest): request is PlayerNeedsTeamRequest =>
  request.type === RequestType.PLAYER_NEEDS_TEAM;

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, InViewDirective],
  templateUrl: './request-list.html',
  styleUrls: ['./request-list.scss'],
})
export class RequestListComponent {
  private readonly api = inject(RequestApiService);

  readonly RequestType = RequestType;

  readonly searchCtrl = new FormControl<string>('', { nonNullable: true });
  readonly typeCtrl = new FormControl<RequestType | 'all'>('all', { nonNullable: true });
  readonly positionCtrl = new FormControl<Position | 'all'>('all', { nonNullable: true });
  readonly skillCtrl = new FormControl<SkillLevel | 'all'>('all', { nonNullable: true });

  readonly typeOptions: Array<Option<RequestType | 'all'>> = [
    { label: 'All types', value: 'all' },
    ...enumStringValues(RequestType).map((value) => ({
      label: humanize(value),
      value: value as RequestType,
    })),
  ];

  readonly positionOptions: Array<Option<Position | 'all'>> = [
    { label: 'All positions', value: 'all' },
    ...enumStringValues(Position).map((value) => ({
      label: humanize(value),
      value: value as Position,
    })),
  ];

  readonly skillOptions: Array<Option<SkillLevel | 'all'>> = [
    { label: 'All skill', value: 'all' },
    ...enumStringValues(SkillLevel).map((value) => ({
      label: humanize(value),
      value: value as SkillLevel,
    })),
  ];

  readonly requests$ = this.api.getRequests().pipe(shareReplay({ bufferSize: 1, refCount: true }));

  readonly offers$ = this.api
    .getPlayerOffers()
    .pipe(map((offers) => offers as PlayerOfferView[]), shareReplay({ bufferSize: 1, refCount: true }));

  readonly vm$ = combineLatest([
    this.requests$,
    this.offers$,
    this.searchCtrl.valueChanges.pipe(startWith(this.searchCtrl.value)),
    this.typeCtrl.valueChanges.pipe(startWith(this.typeCtrl.value)),
    this.positionCtrl.valueChanges.pipe(startWith(this.positionCtrl.value)),
    this.skillCtrl.valueChanges.pipe(startWith(this.skillCtrl.value)),
  ]).pipe(
    map(([requests, offers, search, type, position, skill]) => {
      const query = search.trim().toLowerCase();

      const filteredRequests = requests.filter((request) => {
        const matchesType = type === 'all' || request.type === type;
        return matchesType && this.matchesCommon(request, query, position, skill);
      });

      const showOffers = type === 'all' || type === RequestType.PLAYER_NEEDS_TEAM;
      const filteredOffers = showOffers
        ? offers.filter((offer) => this.matchesCommon(offer, query, position, skill))
        : [];

      const teamRequests = filteredRequests.filter(isTeamNeedsPlayer);
      const playerNeedRequests = filteredRequests.filter(isPlayerNeedsTeam);

      return {
        requests: teamRequests,
        playerOffers: [...playerNeedRequests, ...filteredOffers] as PlayerSideItem[],
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

  teamName(request: TeamNeedsPlayerRequest): string {
    return request.teamName ?? '';
  }

  playerName(item: PlayerSideItem): string {
    return item.playerName ?? '';
  }

  arenaAddr(item: { arenaAddress?: Maybe<string> }): string | undefined {
    return item.arenaAddress ?? undefined;
  }

  mapsUrl(arena?: Maybe<string>, address?: Maybe<string>): string {
    const query = [arena, address].filter((value): value is string => Boolean(value?.trim())).join(', ');

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  private matchesCommon(
    item: FilterableItem,
    query: string,
    position: Position | 'all',
    skill: SkillLevel | 'all',
  ): boolean {
    const matchesSearch =
      query.length === 0 ||
      this.includes(item.arena, query) ||
      this.includes(item.arenaAddress, query) ||
      this.includes(item.time, query) ||
      this.includes(item.notes, query) ||
      this.includes(item.position, query) ||
      this.includes(item.skillLevel, query) ||
      this.includes(item.status, query) ||
      this.includes(item.payAmount, query);

    const matchesPosition = position === 'all' || item.position === position;
    const matchesSkill = skill === 'all' || item.skillLevel === skill;

    return matchesSearch && matchesPosition && matchesSkill;
  }

  private includes(value: unknown, query: string): boolean {
    return String(value ?? '').toLowerCase().includes(query);
  }
}