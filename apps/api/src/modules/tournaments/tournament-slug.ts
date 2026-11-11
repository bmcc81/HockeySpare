/**
 * Readable tournament addresses: `/tournaments/pierrefonds-oldtimers-tournament-2026-11-16`
 * instead of `/tournaments/cmspgfwhd0006g3yqolfrjj9j`.
 *
 * The slug is not stored: it is the tournament's name plus its start date, so
 * it always matches what the page says. Links with the old id keep working.
 */

/** Lower-case words joined by hyphens, accents removed ("Été" becomes "ete"). */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** "pierrefonds-oldtimers-tournament-2026-11-16"; the date is left off when the tournament has none. */
export function tournamentSlug(name: string, startDate: Date | null): string {
  const base = slugify(name) || 'tournament';
  return startDate ? `${base}-${startDate.toISOString().slice(0, 10)}` : base;
}

/** True for a stored tournament id (a cuid, or a seeded `demo-...` id), false for a readable slug. */
export function looksLikeTournamentId(value: string): boolean {
  return /^c[a-z0-9]{20,}$/.test(value) || value.startsWith('demo-');
}
