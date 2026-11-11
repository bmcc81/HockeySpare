import { buildSitemapXml, tournamentChangefreq } from './tournament-sitemap';

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

const t = (over = {}) => ({
  id: 'abc123',
  startDate: utc(2026, 11, 16),
  endDate: utc(2026, 11, 22),
  updatedAt: utc(2026, 11, 7),
  ...over,
});

describe('buildSitemapXml', () => {
  it('lists the public pages and every tournament', () => {
    const xml = buildSitemapXml('https://example.com/', [t(), t({ id: 'zzz' })], utc(2026, 11, 8));
    expect(xml).toContain('<loc>https://example.com/</loc>');
    expect(xml).toContain('<loc>https://example.com/terms</loc>');
    expect(xml).toContain('<loc>https://example.com/tournaments/abc123</loc>');
    expect(xml).toContain('<loc>https://example.com/tournaments/zzz</loc>');
    expect(xml).toContain('<lastmod>2026-11-07</lastmod>');
  });

  it('lists the readable address when the tournament name is known', () => {
    const xml = buildSitemapXml('https://example.com', [t({ name: 'Pierrefonds Oldtimers Tournament' })]);
    expect(xml).toContain('<loc>https://example.com/tournaments/pierrefonds-oldtimers-tournament-2026-11-16</loc>');
    expect(xml).not.toContain('abc123');
  });

  it('still lists the static pages when there are no tournaments', () => {
    const xml = buildSitemapXml('https://example.com', []);
    expect(xml).toContain('<loc>https://example.com/privacy</loc>');
    expect(xml).not.toContain('/tournaments/');
  });

  it('escapes ids so the XML stays valid', () => {
    const xml = buildSitemapXml('https://example.com', [t({ id: 'a&b' })]);
    expect(xml).toContain('/tournaments/a%26b');
    expect(xml).not.toContain('a&b');
  });
});

describe('tournamentChangefreq', () => {
  it('is daily while live or upcoming and for a week after', () => {
    expect(tournamentChangefreq(t(), utc(2026, 11, 20))).toBe('daily');
    expect(tournamentChangefreq(t(), utc(2026, 11, 28))).toBe('daily');
  });
  it('is monthly once it ended over a week ago', () => {
    expect(tournamentChangefreq(t(), utc(2026, 12, 15))).toBe('monthly');
  });
  it('is daily when no dates are set', () => {
    expect(tournamentChangefreq(t({ startDate: null, endDate: null }), utc(2030, 1, 1))).toBe('daily');
  });
});
