import { welcomeEmail } from './welcome-email';

const base = { origin: 'https://example.test', firstName: 'Alex' };

describe('welcomeEmail', () => {
  it('greets by name in English with links to get started', () => {
    const mail = welcomeEmail({ ...base, lang: 'en' });
    expect(mail.subject).toBe('Welcome to HockeySpare');
    expect(mail.text).toContain('Hi Alex, welcome to HockeySpare!');
    expect(mail.text).toContain('https://example.test/requests');
    expect(mail.text).toContain('https://example.test/my-team');
    expect(mail.html).toContain('href="https://example.test/requests/player/new"');
  });

  it('is written in French when asked', () => {
    const mail = welcomeEmail({ ...base, lang: 'fr' });
    expect(mail.subject).toBe('Bienvenue sur HockeySpare');
    expect(mail.text).toContain('Bonjour Alex, bienvenue sur HockeySpare !');
    expect(mail.html).toContain('Ouvrir HockeySpare');
  });

  it('works without a first name', () => {
    expect(welcomeEmail({ ...base, firstName: null, lang: 'en' }).text).toContain(
      'Hi, welcome to HockeySpare!',
    );
    expect(welcomeEmail({ ...base, firstName: '  ', lang: 'fr' }).text).toContain(
      'Bonjour, bienvenue',
    );
  });

  it('escapes the name in the HTML version', () => {
    const mail = welcomeEmail({ ...base, firstName: '<b>Al</b>', lang: 'en' });
    expect(mail.html).not.toContain('<b>Al</b>');
    expect(mail.html).toContain('&lt;b&gt;Al&lt;/b&gt;');
  });
});
