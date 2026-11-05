import { Injectable, computed, signal } from '@angular/core';
import { FR } from './fr';

export type Lang = 'en' | 'fr';

const STORAGE_KEY = 'hs.lang';

function readStoredLang(): Lang | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'fr' || stored === 'en' ? stored : null;
  } catch {
    return null;
  }
}

function browserLang(): Lang {
  try {
    return (navigator.language ?? '').toLowerCase().startsWith('fr') ? 'fr' : 'en';
  } catch {
    return 'en';
  }
}

/**
 * Runtime English/French switch.
 *
 * English text is the lookup key, so templates stay readable
 * (`{{ 'Standings' | t }}`) and any string without a French entry simply
 * shows in English instead of breaking.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly lang = signal<Lang>(readStoredLang() ?? browserLang());

  /** Angular locale id for the date pipe. */
  readonly locale = computed(() => (this.lang() === 'fr' ? 'fr-CA' : 'en-US'));

  constructor() {
    this.applyToDocument(this.lang());
  }

  setLang(lang: Lang): void {
    this.lang.set(lang);
    this.applyToDocument(lang);

    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Private mode etc.: the choice just won't persist.
    }
  }

  toggle(): void {
    this.setLang(this.lang() === 'fr' ? 'en' : 'fr');
  }

  /**
   * Translate an English string. `{name}` placeholders are filled from `params`.
   * A `@@context` suffix tells apart words that translate differently
   * ("Final@@round" vs "Final"); it is dropped when there is no French entry.
   */
  t(key: string, params?: Record<string, string | number | null | undefined>): string {
    const english = key.includes('@@') ? key.slice(0, key.indexOf('@@')) : key;
    const template = this.lang() === 'fr' ? (FR[key] ?? english) : english;

    if (!params) {
      return template;
    }

    return template.replace(/\{(\w+)\}/g, (match, name: string) => {
      const value = params[name];
      return value === null || value === undefined ? match : String(value);
    });
  }

  private applyToDocument(lang: Lang): void {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }
}
