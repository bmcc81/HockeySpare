/**
 * Organizers type text the site cannot translate (volunteer roles and notes).
 * To write it in both languages they put " | " between the English and the
 * French, and each reader gets only their own language:
 *
 *   "Timekeeper | Chronométreur"
 *
 * It works line by line. Text without " | " is used as it is, for everyone.
 *
 * The web app has a matching copy (apps/web/src/app/core/i18n/pick-language.ts)
 * for the pages; keep the two in step.
 */
export const LANGUAGE_SEPARATOR = ' | ';

export function pickLanguage(text: string | null | undefined, lang: string): string {
  if (!text) {
    return '';
  }

  return text
    .split(/\r?\n/)
    .map((line) => {
      const parts = line.split(LANGUAGE_SEPARATOR);
      if (parts.length < 2) {
        return line;
      }
      return (lang === 'fr' ? parts[1] : parts[0]).trim();
    })
    .join('\n');
}
