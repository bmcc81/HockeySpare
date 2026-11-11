import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';

/** True for a stored tournament id (a cuid, or a seeded `demo-...` id), false for a readable address. */
export function looksLikeTournamentId(value: string): boolean {
  return /^c[a-z0-9]{20,}$/.test(value) || value.startsWith('demo-');
}

/**
 * Public tournament pages open at `/tournaments/<name-and-date>` as well as at
 * the old `/tournaments/<id>`. This turns the readable address into the id the
 * page loads its data with. If it cannot be resolved the address is passed on
 * unchanged, so the page shows its usual "could not be found" message.
 */
export const tournamentIdResolver: ResolveFn<string> = (route) => {
  const param = route.paramMap.get('id') ?? '';

  if (!param || looksLikeTournamentId(param)) {
    return param;
  }

  return inject(HttpClient)
    .get<{ id: string }>(`/api/tournaments/resolve/${encodeURIComponent(param)}`)
    .pipe(
      map((result) => result.id),
      catchError(() => of(param)),
    );
};
