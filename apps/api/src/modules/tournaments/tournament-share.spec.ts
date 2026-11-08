import {
  ShareInfo,
  buildShareTags,
  escapeHtml,
  fallbackHtml,
  formatDateRange,
  injectShareTags,
} from './tournament-share';

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

const info = (overrides: Partial<ShareInfo> = {}): ShareInfo => ({
  id: 'abc123',
  name: 'Pierrefonds Oldtimers Tournament',
  description: null,
  startDate: utc(2026, 11, 16),
  endDate: utc(2026, 11, 22),
  logoUrl: null,
  venues: [
    { name: 'CSSR - Centre Sportif Saint-Raphael' },
    { name: 'PFDS - Pierrefonds Sportplexe (rinks 1 & 2)' },
  ],
  ...overrides,
});

const INDEX = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>HockeySpare - Find a spare</title>
    <meta
      name="description"
      content="site wide"
    />
    <link rel="canonical" href="https://example.com/" />
    <meta property="og:title" content="site wide" />
    <meta property="og:image" content="https://example.com/hero.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="theme-color" content="#0d1b2a" />
  </head>
  <body><app-root></app-root></body>
</html>`;

describe('formatDateRange', () => {
  it('formats a same-month range, a cross-month range, one day and nothing', () => {
    expect(formatDateRange(utc(2026, 11, 16), utc(2026, 11, 22))).toBe('Nov 16–22, 2026');
    expect(formatDateRange(utc(2026, 11, 28), utc(2026, 12, 2))).toBe('Nov 28 – Dec 2, 2026');
    expect(formatDateRange(utc(2026, 11, 16), null)).toBe('Nov 16, 2026');
    expect(formatDateRange(null, null)).toBe('');
  });
});

describe('buildShareTags', () => {
  it('uses the name, dates and venue names', () => {
    const tags = buildShareTags(info(), 'https://site.example', 'https://site.example/default.png');
    expect(tags.title).toBe('Pierrefonds Oldtimers Tournament - HockeySpare');
    expect(tags.description).toContain('Nov 16–22, 2026');
    expect(tags.description).toContain('CSSR, PFDS');
    expect(tags.url).toBe('https://site.example/tournaments/abc123');
    expect(tags.image).toBe('https://site.example/default.png');
  });

  it('uses the logo when there is one, making relative paths absolute', () => {
    expect(buildShareTags(info({ logoUrl: 'https://cdn.example/l.png' }), 'https://s', 'd').image).toBe(
      'https://cdn.example/l.png',
    );
    expect(buildShareTags(info({ logoUrl: '/uploads/l.png' }), 'https://s', 'd').image).toBe(
      'https://s/uploads/l.png',
    );
  });
});

describe('injectShareTags', () => {
  const tags = buildShareTags(info(), 'https://site.example', 'https://site.example/default.png');

  it('replaces the site-wide tags and keeps everything else', () => {
    const html = injectShareTags(INDEX, tags);
    expect(html).toContain('<title>Pierrefonds Oldtimers Tournament - HockeySpare</title>');
    expect(html).not.toContain('site wide');
    expect(html).not.toContain('Find a spare');
    expect(html).toContain('og:image" content="https://site.example/default.png"');
    expect(html).toContain('<meta name="theme-color" content="#0d1b2a" />');
    expect(html).toContain('<app-root></app-root>');
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html.match(/og:title/g)).toHaveLength(1);
  });

  it('escapes anything that could break out of an attribute', () => {
    const evil = buildShareTags(info({ name: '"><script>alert(1)</script>' }), 'https://s', 'https://s/d.png');
    const html = injectShareTags(INDEX, evil);
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
    expect(escapeHtml(`a&b"c'`)).toBe('a&amp;b&quot;c&#39;');
  });

  it('still gives crawlers the tags when index.html is unavailable', () => {
    const html = fallbackHtml(tags);
    expect(html).toContain('og:title');
    expect(html).toContain('http-equiv="refresh"');
    expect(html).toContain('https://site.example/tournaments/abc123');
  });
});

describe('event structured data', () => {
  const origin = 'https://site.example';
  const build = (over: Partial<ShareInfo> = {}) =>
    buildShareTags(info(over), origin, `${origin}/default.png`).structuredData;

  it('describes the tournament as a schema.org SportsEvent', () => {
    const data = JSON.parse(build({ venues: [{ name: 'PFDS', address: '13800 Boul. Gouin O, Pierrefonds, QC' }] }));
    expect(data['@type']).toBe('SportsEvent');
    expect(data.name).toBe('Pierrefonds Oldtimers Tournament');
    expect(data.startDate).toBe('2026-11-16');
    expect(data.endDate).toBe('2026-11-22');
    expect(data.url).toBe('https://site.example/tournaments/abc123');
    expect(data.location).toEqual({ '@type': 'Place', name: 'PFDS', address: '13800 Boul. Gouin O, Pierrefonds, QC' });
  });

  it('lists several venues, and leaves out dates and venues that are not set', () => {
    const several = JSON.parse(build());
    expect(Array.isArray(several.location)).toBe(true);
    expect(several.location).toHaveLength(2);

    const bare = JSON.parse(build({ startDate: null, endDate: null, venues: [] }));
    expect(bare.startDate).toBeUndefined();
    expect(bare.endDate).toBeUndefined();
    expect(bare.location).toBeUndefined();
  });

  it('cannot close the script element it sits in', () => {
    const json = build({ name: '</script><script>alert(1)</script>' });
    expect(json).not.toContain('<');
    expect(JSON.parse(json).name).toBe('</script><script>alert(1)</script>');
  });

  it('is added once to the page, replacing any earlier block', () => {
    const tags = buildShareTags(info(), origin, `${origin}/default.png`);
    const page = INDEX.replace('</head>', '<script type="application/ld+json">{"old":true}</script></head>');
    const html = injectShareTags(page, tags);

    expect(html.match(/application\/ld\+json/g)).toHaveLength(1);
    expect(html).not.toContain('"old":true');
    expect(html).toContain('"@type":"SportsEvent"');
  });
});

