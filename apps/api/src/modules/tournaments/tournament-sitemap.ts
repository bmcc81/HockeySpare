import { escapeHtml } from './tournament-share';
import { tournamentSlug } from './tournament-slug';

export interface SitemapTournament {
  id: string;
  /** With the name, the readable address is listed instead of the id. */
  name?: string;
  startDate: Date | null;
  endDate: Date | null;
  updatedAt: Date;
}

/** Pages anyone can open without signing in. */
const STATIC_PAGES: { path: string; changefreq: string; priority: string }[] = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/requests', changefreq: 'daily', priority: '0.6' },
  { path: '/terms', changefreq: 'yearly', priority: '0.2' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.2' },
];

const DAY_MS = 24 * 60 * 60 * 1000;

const day = (date: Date) => date.toISOString().slice(0, 10);

/**
 * Live or upcoming tournaments change daily; tournaments that finished more
 * than a week ago hardly change at all.
 */
export function tournamentChangefreq(t: SitemapTournament, now: Date): 'daily' | 'monthly' {
  const last = t.endDate ?? t.startDate;
  return last && last.getTime() + 7 * DAY_MS < now.getTime() ? 'monthly' : 'daily';
}

export function buildSitemapXml(origin: string, tournaments: SitemapTournament[], now = new Date()): string {
  const base = origin.replace(/\/+$/, '');

  const urls = [
    ...STATIC_PAGES.map(
      (p) =>
        `  <url>\n    <loc>${escapeHtml(base + p.path)}</loc>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`,
    ),
    ...tournaments.map((t) => {
      const monthly = tournamentChangefreq(t, now) === 'monthly';
      return (
        `  <url>\n    <loc>${escapeHtml(`${base}/tournaments/${encodeURIComponent(t.name ? tournamentSlug(t.name, t.startDate) : t.id)}`)}</loc>\n` +
        `    <lastmod>${day(t.updatedAt)}</lastmod>\n` +
        `    <changefreq>${monthly ? 'monthly' : 'daily'}</changefreq>\n` +
        `    <priority>${monthly ? '0.5' : '0.9'}</priority>\n  </url>`
      );
    }),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}
