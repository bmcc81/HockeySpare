/**
 * The "you're signed up" email for a volunteer shift, in English and French.
 * Pure functions so they are easy to test.
 */
import { escapeHtml } from './tournament-share';
import { BuiltEmail, FollowLang, wrapHtml } from './follow/follow-emails';

const TIME_ZONE = process.env.TOURNAMENT_TIME_ZONE ?? 'America/Toronto';

export interface VolunteerConfirmationContext {
  origin: string;
  tournamentId: string;
  tournamentName: string;
  lang: FollowLang;
  volunteerName: string;
  role: string;
  location: string | null;
  description: string | null;
  startsAt: Date;
  endsAt: Date;
  /** Where replies should go; when missing the email says to contact the organizers. */
  contactEmail: string | null;
}

/** "Monday, November 16, 6:00 PM to 8:00 PM" (24-hour clock in French). */
export function formatShiftTime(startsAt: Date, endsAt: Date, lang: FollowLang): string {
  const locale = lang === 'fr' ? 'fr-CA' : 'en-CA';
  const day = new Intl.DateTimeFormat(locale, {
    timeZone: TIME_ZONE,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(startsAt);
  const time = new Intl.DateTimeFormat(locale, {
    timeZone: TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
  });
  const from = time.format(startsAt);
  const to = time.format(endsAt);

  return lang === 'fr' ? `${day}, de ${from} à ${to}` : `${day}, ${from} to ${to}`;
}

export function volunteerConfirmationEmail(ctx: VolunteerConfirmationContext): BuiltEmail {
  const when = formatShiftTime(ctx.startsAt, ctx.endsAt, ctx.lang);
  const tournamentUrl = `${ctx.origin}/tournaments/${ctx.tournamentId}`;
  const fr = ctx.lang === 'fr';
  // French puts a space before the colon.
  const field = (label: string, value: string) => `${label}${fr ? ' :' : ':'} ${value}`;

  const lines = [
    fr
      ? `Bonjour ${ctx.volunteerName}, merci de donner un coup de main au tournoi ${ctx.tournamentName} ! Vous êtes inscrit(e) au quart suivant :`
      : `Hi ${ctx.volunteerName}, thank you for volunteering at ${ctx.tournamentName}! You are signed up for this shift:`,
    field(fr ? 'Rôle' : 'Role', ctx.role),
    field(fr ? 'Quand' : 'When', when),
    ctx.location ? field(fr ? 'Où' : 'Where', ctx.location) : '',
    ctx.description ? field(fr ? 'Détails' : 'Details', ctx.description) : '',
  ].filter(Boolean);

  const change = ctx.contactEmail
    ? fr
      ? 'Si vous ne pouvez plus venir, répondez simplement à ce courriel pour que nous puissions trouver quelqu’un d’autre.'
      : 'If you can no longer make it, just reply to this email so we can find someone else.'
    : fr
      ? 'Si vous ne pouvez plus venir, avertissez les organisateurs du tournoi pour que nous puissions trouver quelqu’un d’autre.'
      : 'If you can no longer make it, please let the tournament organizers know so we can find someone else.';

  const footer = fr
    ? 'Vous recevez ce courriel parce que cette adresse a été utilisée pour s’inscrire comme bénévole.'
    : 'You are getting this email because this address was used to sign up as a volunteer.';

  return {
    subject: fr
      ? `Inscription confirmée : ${ctx.role} (${ctx.tournamentName})`
      : `You're signed up: ${ctx.role} (${ctx.tournamentName})`,
    text: [...lines, '', change, '', `${fr ? 'Page du tournoi' : 'Tournament page'}: ${tournamentUrl}`, '', footer].join('\n'),
    html: wrapHtml(
      [...lines.map(escapeHtml), escapeHtml(change)],
      fr ? 'Voir le tournoi' : 'View the tournament',
      tournamentUrl,
      escapeHtml(footer),
    ),
  };
}
