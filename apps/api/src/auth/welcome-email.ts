/**
 * The first email a new account gets: what to do first, in English or French.
 * A pure function so it is easy to test.
 */
import { escapeHtml } from '../modules/tournaments/tournament-share';
import { BuiltEmail, FollowLang, wrapHtml } from '../modules/tournaments/follow/follow-emails';

export interface WelcomeEmailContext {
  origin: string;
  lang: FollowLang;
  firstName: string | null;
}

export function welcomeEmail(ctx: WelcomeEmailContext): BuiltEmail {
  const fr = ctx.lang === 'fr';
  const name = ctx.firstName?.trim();
  const requestsUrl = `${ctx.origin}/requests`;
  const teamUrl = `${ctx.origin}/my-team`;
  const playerUrl = `${ctx.origin}/requests/player/new`;
  const profileUrl = `${ctx.origin}/profile/player`;

  const greeting = fr
    ? `Bonjour${name ? ` ${name}` : ''}, bienvenue sur HockeySpare !`
    : `Hi${name ? ` ${name}` : ''}, welcome to HockeySpare!`;

  const intro = fr
    ? 'HockeySpare aide les équipes à trouver un substitut et les joueurs à trouver une partie. Pour bien démarrer :'
    : 'HockeySpare helps teams find a spare and players find a game. To get started:';

  const steps = fr
    ? [
        ['Short un joueur ? Publiez une demande de substitut.', requestsUrl],
        ['Envie de jouer ? Offrez-vous comme substitut.', playerUrl],
        ['Vous avez une équipe ? Créez-la et invitez vos coéquipiers.', teamUrl],
        ['Complétez votre profil joueur (poste, niveau, disponibilités).', profileUrl],
      ]
    : [
        ['Short a player? Post a spare request.', requestsUrl],
        ['Want to play? Offer to spare.', playerUrl],
        ['Have a team? Set it up and invite your teammates.', teamUrl],
        ['Fill in your player profile (position, level, availability).', profileUrl],
      ];

  const closing = fr
    ? 'Une question ? Répondez simplement à ce courriel.'
    : 'Questions? Just reply to this email.';
  const footer = fr
    ? 'Vous recevez ce courriel parce qu’un compte HockeySpare a été créé avec cette adresse.'
    : 'You are getting this email because a HockeySpare account was created with this address.';

  const stepText = steps.map(([label, url], i) => `${i + 1}. ${label} ${url}`);
  const stepHtml = `<ol style="margin:0 0 12px;padding-left:20px">${steps
    .map(
      ([label, url]) =>
        `<li style="margin:0 0 6px"><a href="${escapeHtml(url)}" style="color:#2f6bff">${escapeHtml(label)}</a></li>`,
    )
    .join('')}</ol>`;

  return {
    subject: fr ? 'Bienvenue sur HockeySpare' : 'Welcome to HockeySpare',
    text: [greeting, '', intro, '', ...stepText, '', closing, '', footer].join('\n'),
    html: wrapHtml(
      [escapeHtml(greeting), escapeHtml(intro), stepHtml, escapeHtml(closing)],
      fr ? 'Ouvrir HockeySpare' : 'Open HockeySpare',
      requestsUrl,
      escapeHtml(footer),
    ),
  };
}
