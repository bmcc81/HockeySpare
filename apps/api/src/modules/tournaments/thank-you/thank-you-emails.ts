/**
 * The one-time "thank you for being part of the tournament" email, sent by an
 * organizer after the final to everyone who followed a team or volunteered.
 * Pure functions so they are easy to test.
 */
import { escapeHtml } from '../tournament-share';
import { BuiltEmail, FollowLang, wrapHtml } from '../follow/follow-emails';

export type ThankYouLang = FollowLang | 'both';

export interface ThankYouContext {
  origin: string;
  tournamentId: string;
  tournamentName: string;
  /** "both" writes French then English, for people whose language we don't know. */
  lang: ThankYouLang;
  name: string | null;
  /** A personal line from the organizers, shown before the rest. */
  note: string | null;
}

interface Copy {
  greeting: string;
  thanks: string;
  results: string;
  pitch: string;
  joinLabel: string;
  footer: string;
}

function copy(lang: FollowLang, ctx: ThankYouContext): Copy {
  const fr = lang === 'fr';
  const who = ctx.name?.trim();

  return {
    greeting: fr ? `Bonjour${who ? ` ${who}` : ''},` : `Hi${who ? ` ${who}` : ''},`,
    thanks: fr
      ? `Merci d’avoir fait partie du tournoi ${ctx.tournamentName} ! Que vous ayez joué, bénévolé ou suivi une équipe, vous avez fait de cette semaine une réussite.`
      : `Thank you for being part of ${ctx.tournamentName}! Whether you played, volunteered or followed a team, you helped make the week a success.`,
    results: fr
      ? 'Les résultats finaux et le classement sont sur la page du tournoi :'
      : 'The final results and standings are on the tournament page:',
    pitch: fr
      ? 'Vous jouez au hockey le reste de l’année ? HockeySpare aide les équipes à trouver un substitut et les joueurs à trouver une partie, gratuitement. Créez votre équipe habituelle :'
      : 'Playing hockey the rest of the year? HockeySpare helps teams find a spare and players find a game, free. Set up your regular team:',
    joinLabel: fr ? 'Créer mon compte' : 'Create my account',
    footer: fr
      ? `Vous recevez ce courriel unique parce que cette adresse s’est inscrite aux rappels ou au bénévolat du tournoi ${ctx.tournamentName}.`
      : `You are getting this one-time email because this address signed up for reminders or volunteering at ${ctx.tournamentName}.`,
  };
}

export function thankYouEmail(ctx: ThankYouContext): BuiltEmail {
  const tournamentUrl = `${ctx.origin}/tournaments/${ctx.tournamentId}`;
  const joinUrl = `${ctx.origin}/register`;
  const note = ctx.note?.trim() || null;
  const langs: FollowLang[] = ctx.lang === 'both' ? ['fr', 'en'] : [ctx.lang];
  const copies = langs.map((l) => copy(l, ctx));

  const subject =
    ctx.lang === 'fr'
      ? `Merci d’avoir fait partie de ${ctx.tournamentName}`
      : ctx.lang === 'en'
        ? `Thank you for being part of ${ctx.tournamentName}`
        : `Merci / Thank you – ${ctx.tournamentName}`;

  const textBlocks = copies.map((c) =>
    [c.greeting, c.thanks, '', c.results, tournamentUrl, '', c.pitch, joinUrl].join('\n'),
  );
  const htmlBlocks = copies.flatMap((c, i) => [
    escapeHtml(c.greeting),
    escapeHtml(c.thanks),
    `${escapeHtml(c.results)} <a href="${escapeHtml(tournamentUrl)}" style="color:#2f6bff">${escapeHtml(tournamentUrl)}</a>`,
    escapeHtml(c.pitch),
    ...(i < copies.length - 1 ? ['<hr style="border:none;border-top:1px solid #ddd;margin:16px 0" />'] : []),
  ]);

  const text = [note, ...textBlocks, copies.map((c) => c.footer).join('\n')]
    .filter((part) => part !== null)
    .join('\n\n');

  return {
    subject,
    text,
    html: wrapHtml(
      [...(note ? [`<span style="white-space:pre-wrap">${escapeHtml(note)}</span>`] : []), ...htmlBlocks],
      copies[0].joinLabel,
      joinUrl,
      copies.map((c) => escapeHtml(c.footer)).join('<br />'),
    ),
  };
}
