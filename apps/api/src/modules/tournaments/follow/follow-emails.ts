/**
 * Emails for "follow this team": the confirmation and the pre-game reminder,
 * in English and French. Pure functions so they are easy to test.
 */
import { escapeHtml } from '../tournament-share';

export type FollowLang = 'en' | 'fr';

export interface FollowEmailBase {
  origin: string;
  tournamentId: string;
  tournamentName: string;
  teamName: string;
  teamId: string;
  token: string;
  lang: FollowLang;
}

export interface ReminderGame {
  id: string;
  gameNumber: string | null;
  division: string | null;
  startsAt: Date;
  arenaName: string | null;
  /** Street address of the arena, when known. */
  address: string | null;
  homeTeamName: string;
  awayTeamName: string;
}

export interface BuiltEmail {
  subject: string;
  text: string;
  html: string;
}

const TIME_ZONE = process.env.TOURNAMENT_TIME_ZONE ?? 'America/Toronto';

export function normalizeLang(value: unknown): FollowLang {
  return value === 'fr' ? 'fr' : 'en';
}

export function formatGameTime(date: Date, lang: FollowLang): string {
  return new Intl.DateTimeFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', {
    timeZone: TIME_ZONE,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function confirmUrl(origin: string, token: string): string {
  return `${origin}/api/follow/confirm?token=${encodeURIComponent(token)}`;
}

export function unsubscribeUrl(origin: string, token: string): string {
  return `${origin}/api/follow/unsubscribe?token=${encodeURIComponent(token)}`;
}

export function wrapHtml(lines: string[], buttonLabel: string | null, buttonUrl: string | null, footer: string): string {
  const body = lines.map((l) => `<p style="margin:0 0 12px">${l}</p>`).join('');
  const button =
    buttonLabel && buttonUrl
      ? `<p style="margin:16px 0"><a href="${escapeHtml(buttonUrl)}" style="background:#2f6bff;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none;display:inline-block">${escapeHtml(buttonLabel)}</a></p>`
      : '';
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#111;max-width:520px">${body}${button}<p style="margin:24px 0 0;font-size:12px;color:#666">${footer}</p></div>`;
}

export function confirmationEmail(ctx: FollowEmailBase): BuiltEmail {
  const url = confirmUrl(ctx.origin, ctx.token);
  const tournament = `${ctx.origin}/tournaments/${ctx.tournamentId}`;

  if (ctx.lang === 'fr') {
    const intro = `Vous avez demandé des rappels par courriel avant les matchs de ${ctx.teamName} au tournoi ${ctx.tournamentName}.`;
    const ask = 'Confirmez votre adresse pour les recevoir :';
    const ignore = "Si ce n'est pas vous, ignorez simplement ce message : rien ne sera envoyé.";
    return {
      subject: `Confirmez vos rappels pour ${ctx.teamName}`,
      text: [intro, '', ask, url, '', ignore, '', tournament].join('\n'),
      html: wrapHtml([escapeHtml(intro), escapeHtml(ask)], 'Confirmer', url, escapeHtml(ignore)),
    };
  }

  const intro = `You asked for email reminders before ${ctx.teamName}'s games at ${ctx.tournamentName}.`;
  const ask = 'Confirm your address to start receiving them:';
  const ignore = "If this wasn't you, just ignore this message and nothing will be sent.";
  return {
    subject: `Confirm your reminders for ${ctx.teamName}`,
    text: [intro, '', ask, url, '', ignore, '', tournament].join('\n'),
    html: wrapHtml([escapeHtml(intro), escapeHtml(ask)], 'Confirm', url, escapeHtml(ignore)),
  };
}

export function reminderEmail(ctx: FollowEmailBase, game: ReminderGame): BuiltEmail {
  const when = formatGameTime(game.startsAt, ctx.lang);
  const where = [game.arenaName, game.address].filter(Boolean).join(', ');
  const matchup = `${game.homeTeamName} vs ${game.awayTeamName}`;
  const gameUrl = `${ctx.origin}/tournaments/${ctx.tournamentId}#game-${game.id}`;
  const unsub = unsubscribeUrl(ctx.origin, ctx.token);
  const num = game.gameNumber ? ` (${game.gameNumber})` : '';

  if (ctx.lang === 'fr') {
    const lines = [
      `Rappel : ${ctx.teamName} joue bientôt au tournoi ${ctx.tournamentName}.`,
      `${matchup}${num}`,
      `Quand : ${when}`,
      where ? `Où : ${where}` : '',
      game.division ? `Division : ${game.division}` : '',
    ].filter(Boolean);
    return {
      subject: `Match bientôt : ${matchup}`,
      text: [...lines, '', `Détails et pointages en direct : ${gameUrl}`, '', `Se désabonner : ${unsub}`].join('\n'),
      html: wrapHtml(lines.map(escapeHtml), 'Voir le match', gameUrl, `<a href="${escapeHtml(unsub)}">Se désabonner</a>`),
    };
  }

  const lines = [
    `Reminder: ${ctx.teamName} plays soon at ${ctx.tournamentName}.`,
    `${matchup}${num}`,
    `When: ${when}`,
    where ? `Where: ${where}` : '',
    game.division ? `Division: ${game.division}` : '',
  ].filter(Boolean);
  return {
    subject: `Game soon: ${matchup}`,
    text: [...lines, '', `Details and live scores: ${gameUrl}`, '', `Unsubscribe: ${unsub}`].join('\n'),
    html: wrapHtml(lines.map(escapeHtml), 'View game', gameUrl, `<a href="${escapeHtml(unsub)}">Unsubscribe</a>`),
  };
}
