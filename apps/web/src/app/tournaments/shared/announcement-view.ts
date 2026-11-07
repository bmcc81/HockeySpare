import { pickLanguage } from '../../core/i18n/pick-language';

export interface AnnouncementRow {
  /** A short lead-in such as "Mon", split off lines written as "Mon: Pizza". */
  label: string | null;
  text: string;
}

export interface AnnouncementView {
  /** Heading for longer announcements (the first line), otherwise null. */
  title: string | null;
  rows: AnnouncementRow[];
}

/** "Mon: Pizza" and the French "Lun : Pizza": a short label, a colon, then the text. */
const LABELLED_ROW = /^(\S.{0,11}?)\s?:\s+(\S.*)$/;

/**
 * Turns an announcement's text into something easy to read: in the visitor's
 * language, the first line as a heading when there are several lines, and
 * short "Label: text" lines split into two columns.
 */
export function parseAnnouncement(body: string, lang: string): AnnouncementView {
  const lines = pickLanguage(body, lang)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const hasTitle = lines.length >= 3 && !/[.!?]$/.test(lines[0]);
  const title = hasTitle ? lines[0] : null;
  const rest = hasTitle ? lines.slice(1) : lines;

  return {
    title,
    rows: rest.map((line) => {
      const match = LABELLED_ROW.exec(line);
      return match ? { label: match[1], text: match[2] } : { label: null, text: line };
    }),
  };
}

/** What to show on a collapsed announcement: its heading, or the start of its text. */
export function announcementSummary(view: AnnouncementView): string {
  if (view.title) {
    return view.title;
  }
  const first = view.rows[0]?.text ?? '';
  return first.length > 70 ? `${first.slice(0, 67)}...` : first;
}
