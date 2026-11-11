import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { convertToParamMap, type ActivatedRouteSnapshot } from '@angular/router';
import { firstValueFrom, isObservable } from 'rxjs';

import { looksLikeTournamentId, tournamentIdResolver } from './tournament-id.resolver';

const routeWith = (id: string) =>
  ({ paramMap: convertToParamMap({ id }) }) as unknown as ActivatedRouteSnapshot;

describe('looksLikeTournamentId', () => {
  it('tells stored ids from readable addresses', () => {
    expect(looksLikeTournamentId('cmspgfwhd0006g3yqolfrjj9j')).toBe(true);
    expect(looksLikeTournamentId('demo-spring-classic')).toBe(true);
    expect(looksLikeTournamentId('pierrefonds-oldtimers-tournament-2026-11-16')).toBe(false);
  });
});

describe('tournamentIdResolver', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  const run = (id: string) =>
    TestBed.runInInjectionContext(() => tournamentIdResolver(routeWith(id), {} as never));

  it('passes a stored id straight through without a request', () => {
    expect(run('cmspgfwhd0006g3yqolfrjj9j')).toBe('cmspgfwhd0006g3yqolfrjj9j');
    http.expectNone(() => true);
  });

  it('looks up a readable address', async () => {
    const result = run('pierrefonds-oldtimers-tournament-2026-11-16');
    expect(isObservable(result)).toBe(true);

    const pending = firstValueFrom(result as never);
    http
      .expectOne('/api/tournaments/resolve/pierrefonds-oldtimers-tournament-2026-11-16')
      .flush({ id: 'cmspgfwhd0006g3yqolfrjj9j' });

    expect(await pending).toBe('cmspgfwhd0006g3yqolfrjj9j');
  });

  it('keeps the address when it cannot be resolved', async () => {
    const pending = firstValueFrom(run('no-such-tournament') as never);
    http
      .expectOne('/api/tournaments/resolve/no-such-tournament')
      .flush('missing', { status: 404, statusText: 'Not Found' });

    expect(await pending).toBe('no-such-tournament');
  });
});
