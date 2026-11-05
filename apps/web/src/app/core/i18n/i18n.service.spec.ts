import { TestBed } from '@angular/core/testing';
import { FR } from './fr';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  let i18n: I18nService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    i18n = TestBed.inject(I18nService);
  });

  afterEach(() => localStorage.clear());

  it('returns the English text unchanged in English', () => {
    i18n.setLang('en');
    expect(i18n.t('Standings')).toBe('Standings');
  });

  it('translates to French and falls back to English when there is no entry', () => {
    i18n.setLang('fr');
    expect(i18n.t('Standings')).toBe('Classement');
    expect(i18n.t('A string nobody translated')).toBe('A string nobody translated');
  });

  it('fills {placeholders} in both languages and leaves unknown ones visible', () => {
    i18n.setLang('en');
    expect(i18n.t('{n} spots left', { n: 3 })).toBe('3 spots left');
    i18n.setLang('fr');
    expect(i18n.t('{n} spots left', { n: 3 })).toBe('3 places restantes');
    expect(i18n.t('{n} spots left')).toBe('{n} places restantes');
  });

  it('uses @@context to tell apart words and drops it when untranslated', () => {
    i18n.setLang('fr');
    expect(i18n.t('Register')).toBe('S’inscrire');
    expect(i18n.t('Register@@tab')).toBe('Inscription');
    expect(i18n.t('Nothing here@@ctx')).toBe('Nothing here');
    i18n.setLang('en');
    expect(i18n.t('Register@@tab')).toBe('Register');
  });

  it('remembers the choice and updates the document language', () => {
    i18n.setLang('fr');
    expect(localStorage.getItem('hs.lang')).toBe('fr');
    expect(document.documentElement.lang).toBe('fr');
    expect(i18n.locale()).toBe('fr-CA');
    i18n.toggle();
    expect(i18n.lang()).toBe('en');
    expect(i18n.locale()).toBe('en-US');
  });

  it('keeps every French entry using the same {placeholders} as its English key', () => {
    const names = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');

    const mismatched = Object.entries(FR)
      .filter(([en, fr]) => names(fr) !== names(en))
      .map(([en]) => en);

    expect(mismatched).toEqual([]);
  });
});
