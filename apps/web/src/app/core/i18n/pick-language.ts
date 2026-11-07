/**
 * Organizers type text the site cannot translate (announcements, volunteer
 * roles and notes). To write it in both languages they put " | " between the
 * English and the French, and visitors see only their own language:
 *
 *   "Timekeeper | Chronométreur"
 *
 * It works line by line, so a multi-line announcement can be written as
 * "English line | Ligne en français" on every line. Text without " | " is
 * shown as it is, to everyone.
 *
 * The API has a matching copy (apps/api/src/modules/tournaments/pick-language.ts)
 * for emails; keep the two in step.
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
