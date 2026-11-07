import { pickLanguage } from './pick-language';

describe('pickLanguage', () => {
  it('gives each language its own half of "English | Français"', () => {
    expect(pickLanguage('Timekeeper | Chronométreur', 'en')).toBe('Timekeeper');
    expect(pickLanguage('Timekeeper | Chronométreur', 'fr')).toBe('Chronométreur');
  });

  it('uses text without a separator as it is, in either language', () => {
    expect(pickLanguage('Check-in Desk', 'fr')).toBe('Check-in Desk');
  });

  it('works line by line', () => {
    expect(pickLanguage('A | B\nplain', 'fr')).toBe('B\nplain');
  });

  it('returns an empty string for nothing', () => {
    expect(pickLanguage(null, 'en')).toBe('');
    expect(pickLanguage(undefined, 'fr')).toBe('');
  });
});
