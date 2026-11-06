import {
  FollowEmailBase,
  ReminderGame,
  confirmationEmail,
  formatGameTime,
  normalizeLang,
  reminderEmail,
  unsubscribeUrl,
} from './follow-emails';

const base = (lang: 'en' | 'fr' = 'en', over: Partial<FollowEmailBase> = {}): FollowEmailBase => ({
  origin: 'https://site.example',
  tournamentId: 'tour1',
  tournamentName: 'Pierrefonds Oldtimers',
  teamName: 'EAGLES',
  teamId: 'team1',
  token: 'tok_123',
  lang,
  ...over,
});

const game: ReminderGame = {
  id: 'g1',
  gameNumber: 'A3',
  division: '35B',
  startsAt: new Date(Date.UTC(2026, 10, 17, 0, 0, 0)), // Mon Nov 16, 7:00 PM in Montreal
  arenaName: 'CSSR',
  address: '750 Boul. Jacques-Bizard',
  homeTeamName: 'ILE BIZARD ALL STARS',
  awayTeamName: 'EAGLES',
};

describe('follow emails', () => {
  it('normalizes the language', () => {
    expect(normalizeLang('fr')).toBe('fr');
    expect(normalizeLang('de')).toBe('en');
    expect(normalizeLang(undefined)).toBe('en');
  });

  it('formats the game time in the tournament time zone', () => {
    expect(formatGameTime(game.startsAt, 'en')).toContain('7:00');
    expect(formatGameTime(game.startsAt, 'en')).toContain('November');
    expect(formatGameTime(game.startsAt, 'fr')).toContain('novembre');
  });

  it('confirmation email has the confirm link, in both languages', () => {
    const en = confirmationEmail(base('en'));
    expect(en.subject).toBe('Confirm your reminders for EAGLES');
    expect(en.text).toContain('https://site.example/api/follow/confirm?token=tok_123');
    expect(en.html).toContain('href="https://site.example/api/follow/confirm?token=tok_123"');

    const fr = confirmationEmail(base('fr'));
    expect(fr.subject).toBe('Confirmez vos rappels pour EAGLES');
    expect(fr.text).toContain('Confirmez votre adresse');
  });

  it('reminder email has the matchup, time, place and an unsubscribe link', () => {
    const en = reminderEmail(base('en'), game);
    expect(en.subject).toBe('Game soon: ILE BIZARD ALL STARS vs EAGLES');
    expect(en.text).toContain('When: ');
    expect(en.text).toContain('CSSR, 750 Boul. Jacques-Bizard');
    expect(en.text).toContain('Division: 35B');
    expect(en.text).toContain(unsubscribeUrl('https://site.example', 'tok_123'));
    expect(en.text).toContain('https://site.example/tournaments/tour1#game-g1');

    const fr = reminderEmail(base('fr'), game);
    expect(fr.subject).toBe('Match bientôt : ILE BIZARD ALL STARS vs EAGLES');
    expect(fr.text).toContain('Se désabonner');
  });

  it('escapes team and tournament names in the HTML', () => {
    const html = reminderEmail(base('en', { teamName: '<b>X</b>' }), game).html;
    expect(html).not.toContain('<b>X</b>');
    expect(html).toContain('&lt;b&gt;X&lt;/b&gt;');
  });

  it('leaves out lines it has no data for', () => {
    const text = reminderEmail(base('en'), { ...game, arenaName: null, address: null, division: null }).text;
    expect(text).not.toContain('Where:');
    expect(text).not.toContain('Division:');
  });
});
