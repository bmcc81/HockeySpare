import { ThankYouLang } from './thank-you-emails';

export interface ThankYouRecipient {
  email: string;
  lang: ThankYouLang;
  name: string | null;
}

/**
 * Everyone who should get the thank-you: confirmed team followers (in the
 * language they chose) and volunteers who left an email. One email per
 * address, even if the person did both; volunteers bring a name, followers a
 * language. When a language isn't known the email is written in both.
 */
export function mergeRecipients(
  follows: { email: string; lang: string }[],
  volunteers: { email: string | null; name: string }[],
): ThankYouRecipient[] {
  const byEmail = new Map<string, ThankYouRecipient>();

  for (const follow of follows) {
    const email = follow.email.trim().toLowerCase();
    if (!email) continue;
    byEmail.set(email, { email, lang: follow.lang === 'fr' ? 'fr' : 'en', name: null });
  }

  for (const volunteer of volunteers) {
    const email = volunteer.email?.trim().toLowerCase();
    if (!email) continue;
    const existing = byEmail.get(email);
    byEmail.set(email, {
      email,
      lang: existing?.lang ?? 'both',
      name: volunteer.name.trim() || existing?.name || null,
    });
  }

  return Array.from(byEmail.values());
}
