import { pickLanguage } from '../../core/i18n/pick-language';
import { announcementSummary, parseAnnouncement } from './announcement-view';

describe('pickLanguage', () => {
  it('shows the English part to English visitors and the French part to French visitors', () => {
    expect(pickLanguage('Timekeeper | Chronométreur', 'en')).toBe('Timekeeper');
    expect(pickLanguage('Timekeeper | Chronométreur', 'fr')).toBe('Chronométreur');
  });

  it('leaves text without a separator as it is, for everyone', () => {
    expect(pickLanguage('Doors open at 7', 'fr')).toBe('Doors open at 7');
  });

  it('works line by line', () => {
    const body = 'Menu | Menu des repas\nMon: Pizza | Lun : Pizza\nNo translation here';
    expect(pickLanguage(body, 'en')).toBe('Menu\nMon: Pizza\nNo translation here');
    expect(pickLanguage(body, 'fr')).toBe('Menu des repas\nLun : Pizza\nNo translation here');
  });

  it('copes with empty text', () => {
    expect(pickLanguage(null, 'en')).toBe('');
    expect(pickLanguage('', 'fr')).toBe('');
  });
});

describe('parseAnnouncement', () => {
  const menu = [
    'Food menu (Île Bizard unless noted) | Menu des repas (Île Bizard sauf indication)',
    'Mon: PFDS: Pizza | Lun : PFDS : Pizza',
    'Tue: Burger with fries | Mar : Hamburger avec frites',
  ].join('\n');

  it('uses the first line as a heading and splits "Label: text" rows', () => {
    const view = parseAnnouncement(menu, 'en');

    expect(view.title).toBe('Food menu (Île Bizard unless noted)');
    expect(view.rows).toEqual([
      { label: 'Mon', text: 'PFDS: Pizza' },
      { label: 'Tue', text: 'Burger with fries' },
    ]);
  });

  it('does the same in French, including the space before the colon', () => {
    const view = parseAnnouncement(menu, 'fr');

    expect(view.title).toBe('Menu des repas (Île Bizard sauf indication)');
    expect(view.rows).toEqual([
      { label: 'Lun', text: 'PFDS : Pizza' },
      { label: 'Mar', text: 'Hamburger avec frites' },
    ]);
  });

  it('keeps a short message as plain text with no heading', () => {
    expect(parseAnnouncement('Doors open at 7 tonight.', 'en')).toEqual({
      title: null,
      rows: [{ label: null, text: 'Doors open at 7 tonight.' }],
    });
  });

  it('does not make a heading out of a two-line sentence', () => {
    const view = parseAnnouncement('Parking is full.\nPlease use the side lot.', 'en');
    expect(view.title).toBeNull();
    expect(view.rows).toHaveLength(2);
  });

  it('does not treat a long lead-in before a colon as a label', () => {
    const view = parseAnnouncement('Reminder to bring both jerseys: dark and white', 'en');
    expect(view.rows[0].label).toBeNull();
  });

  it('summarises a collapsed announcement by its heading or its start', () => {
    expect(announcementSummary(parseAnnouncement(menu, 'en'))).toBe('Food menu (Île Bizard unless noted)');
    expect(announcementSummary(parseAnnouncement('x'.repeat(100), 'en'))).toHaveLength(70);
  });
});
