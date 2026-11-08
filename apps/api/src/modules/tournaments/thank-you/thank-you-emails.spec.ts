import { thankYouEmail } from './thank-you-emails';

const base = {
  origin: 'https://example.test',
  tournamentId: 't1',
  tournamentName: 'Oldtimers Cup',
  name: 'Sam',
  note: null,
};

describe('thankYouEmail', () => {
  it('thanks in English with the results link', () => {
    const mail = thankYouEmail({ ...base, lang: 'en' });
    expect(mail.subject).toBe('Thank you for being part of Oldtimers Cup');
    expect(mail.text).toContain('Hi Sam,');
    expect(mail.text).toContain('https://example.test/tournaments/t1');
    expect(mail.text).toContain('https://example.test/register');
    expect(mail.html).toContain('Create my account');
  });

  it('thanks in French', () => {
    const mail = thankYouEmail({ ...base, lang: 'fr' });
    expect(mail.subject).toBe('Merci d’avoir fait partie de Oldtimers Cup');
    expect(mail.text).toContain('Bonjour Sam,');
    expect(mail.html).toContain('Créer mon compte');
  });

  it('writes both languages, French first, when the language is unknown', () => {
    const mail = thankYouEmail({ ...base, lang: 'both', name: null });
    expect(mail.subject).toBe('Merci / Thank you – Oldtimers Cup');
    expect(mail.text.indexOf('Bonjour,')).toBeGreaterThan(-1);
    expect(mail.text.indexOf('Bonjour,')).toBeLessThan(mail.text.indexOf('Hi,'));
  });

  it('puts the organizers’ note first and escapes it in HTML', () => {
    const mail = thankYouEmail({ ...base, lang: 'en', note: 'See you next year <3' });
    expect(mail.text.startsWith('See you next year <3')).toBe(true);
    expect(mail.html).toContain('See you next year &lt;3');
    expect(mail.html).not.toContain('year <3');
  });
});
