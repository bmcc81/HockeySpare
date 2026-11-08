/**
 * Link-preview ("share card") support for public tournament pages.
 *
 * The web app is a single-page app, and chat/social link crawlers don't run
 * JavaScript, so they only ever see the site-wide tags in index.html. The
 * server therefore answers `/tournaments/<id>` with the same index.html but
 * with the tournament's own title, description and image in the head.
 */

export interface ShareInfo {
  id: string;
  name: string;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
  logoUrl: string | null;
  venues: { name: string; address?: string | null }[];
}

export interface ShareTags {
  title: string;
  description: string;
  url: string;
  image: string;
  /** schema.org SportsEvent as JSON, for Google's event results. */
  structuredData: string;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Nov 16-22, 2026", "Nov 28 - Dec 2, 2026" or "Nov 16, 2026". Dates are stored as UTC midnight. */
export function formatDateRange(start: Date | null, end: Date | null): string {
  const first = start ?? end;
  if (!first) return '';

  const s = { y: first.getUTCFullYear(), m: first.getUTCMonth(), d: first.getUTCDate() };
  const last = end ?? start;
  const e = last ? { y: last.getUTCFullYear(), m: last.getUTCMonth(), d: last.getUTCDate() } : s;

  if (s.y === e.y && s.m === e.m && s.d === e.d) {
    return `${MONTHS[s.m]} ${s.d}, ${s.y}`;
  }
  if (s.y === e.y && s.m === e.m) {
    return `${MONTHS[s.m]} ${s.d}–${e.d}, ${s.y}`;
  }
  if (s.y === e.y) {
    return `${MONTHS[s.m]} ${s.d} – ${MONTHS[e.m]} ${e.d}, ${s.y}`;
  }
  return `${MONTHS[s.m]} ${s.d}, ${s.y} – ${MONTHS[e.m]} ${e.d}, ${e.y}`;
}

const TAGLINE = 'Live scores, standings and schedule · Pointages, classements et calendrier en direct';

const dateOnly = (d: Date) => d.toISOString().slice(0, 10);

/** JSON that is safe to place inside a <script> element. */
function jsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

/**
 * Event details for Google (schema.org SportsEvent). Dates are whole days, the
 * way the tournament stores them. The contact email is left out on purpose.
 */
export function buildEventJsonLd(info: ShareInfo, url: string, image: string, description: string): string {
  const places = info.venues
    .filter((v) => v.name.trim())
    .map((v) => ({
      '@type': 'Place',
      name: v.name.trim(),
      ...(v.address?.trim() ? { address: v.address.trim() } : {}),
    }));

  return jsonForScript({
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: info.name,
    description,
    url,
    image: [image],
    sport: 'Ice hockey',
    inLanguage: ['en', 'fr'],
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    ...(info.startDate ? { startDate: dateOnly(info.startDate) } : {}),
    ...(info.endDate ?? info.startDate ? { endDate: dateOnly((info.endDate ?? info.startDate) as Date) } : {}),
    ...(places.length === 1 ? { location: places[0] } : places.length > 1 ? { location: places } : {}),
  });
}

export function buildShareTags(info: ShareInfo, origin: string, defaultImage: string): ShareTags {
  const venueNames = info.venues
    .map((v) => v.name.split(/\s+-\s+/)[0].trim())
    .filter(Boolean)
    .slice(0, 3);

  const parts = [formatDateRange(info.startDate, info.endDate), venueNames.join(', ')].filter(Boolean);
  const intro = parts.join(' · ');
  const description = (intro ? `${intro}. ` : '') + TAGLINE;

  let image = defaultImage;
  if (info.logoUrl) {
    image = /^https?:\/\//i.test(info.logoUrl)
      ? info.logoUrl
      : `${origin}${info.logoUrl.startsWith('/') ? '' : '/'}${info.logoUrl}`;
  }

  const url = `${origin}/tournaments/${encodeURIComponent(info.id)}`;
  const shortDescription = description.slice(0, 300);

  return {
    title: `${info.name} - HockeySpare`,
    description: shortDescription,
    url,
    image,
    structuredData: buildEventJsonLd(info, url, image, shortDescription),
  };
}

/** Replace the site-wide title/description/preview tags in `indexHtml` with the tournament's. */
export function injectShareTags(indexHtml: string, tags: ShareTags): string {
  const stripped = indexHtml
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<link\s[^>]*rel="canonical"[^>]*>/gi, '')
    .replace(/<script\s[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(
      /<meta\s[^>]*?(?:name|property)="(?:description|og:[^"]*|twitter:[^"]*)"[^>]*>/gi,
      '',
    );

  const t = escapeHtml(tags.title);
  const d = escapeHtml(tags.description);
  const u = escapeHtml(tags.url);
  const i = escapeHtml(tags.image);

  const block = [
    `<title>${t}</title>`,
    `<meta name="description" content="${d}" />`,
    `<link rel="canonical" href="${u}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="HockeySpare" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:url" content="${u}" />`,
    `<meta property="og:image" content="${i}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
    `<meta name="twitter:image" content="${i}" />`,
    `<script type="application/ld+json">${tags.structuredData}</script>`,
  ].join('\n    ');

  return /<\/head>/i.test(stripped)
    ? stripped.replace(/<\/head>/i, `    ${block}\n  </head>`)
    : stripped;
}

/** Last-resort page (index.html unreadable): crawlers get the tags, people are sent to the app. */
export function fallbackHtml(tags: ShareTags): string {
  const url = escapeHtml(tags.url);
  const page =
    '<!doctype html><html lang="en"><head><meta charset="utf-8" />' +
    `<meta http-equiv="refresh" content="0; url=${url}" /></head>` +
    `<body><a href="${url}">${escapeHtml(tags.title)}</a></body></html>`;

  return injectShareTags(page, tags);
}
