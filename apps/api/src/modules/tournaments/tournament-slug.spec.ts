import { looksLikeTournamentId, slugify, tournamentSlug } from './tournament-slug';

describe('slugify', () => {
  it('lower-cases and joins words with hyphens', () => {
    expect(slugify('Pierrefonds Oldtimers Tournament')).toBe('pierrefonds-oldtimers-tournament');
  });

  it('removes accents and punctuation', () => {
    expect(slugify("Tournoi d'été de l'Île-Bizard!")).toBe('tournoi-d-ete-de-l-ile-bizard');
  });

  it('spells out ampersands', () => {
    expect(slugify('Pros & Joes')).toBe('pros-and-joes');
  });
});

describe('tournamentSlug', () => {
  it('adds the start date', () => {
    expect(
      tournamentSlug('Pierrefonds Oldtimers Tournament', new Date('2026-11-16T00:00:00.000Z')),
    ).toBe('pierrefonds-oldtimers-tournament-2026-11-16');
  });

  it('leaves the date off when there is none', () => {
    expect(tournamentSlug('Spring Classic', null)).toBe('spring-classic');
  });

  it('never returns an empty slug', () => {
    expect(tournamentSlug('???', null)).toBe('tournament');
  });
});

describe('looksLikeTournamentId', () => {
  it('recognises stored ids', () => {
    expect(looksLikeTournamentId('cmspgfwhd0006g3yqolfrjj9j')).toBe(true);
    expect(looksLikeTournamentId('demo-spring-classic')).toBe(true);
  });

  it('does not treat a readable slug as an id', () => {
    expect(looksLikeTournamentId('pierrefonds-oldtimers-tournament-2026-11-16')).toBe(false);
  });
});
