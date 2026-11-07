import { formatShiftTime, volunteerConfirmationEmail } from './volunteer-emails';

describe('volunteer confirmation email', () => {
  // 6-8 PM in Montreal on Mon Nov 16 2026 (EST, UTC-5).
  const base = {
    origin: 'https://site.example',
    tournamentId: 't1',
    tournamentName: 'Pierrefonds Oldtimers Tournament',
    volunteerName: 'Pat',
    role: 'Timekeeper',
    location: 'CSSR (Île Bizard)',
    description: null,
    startsAt: new Date('2026-11-16T23:00:00Z'),
    endsAt: new Date('2026-11-17T01:00:00Z'),
    contactEmail: null,
  };

  it('writes the shift time in the tournament time zone, not UTC', () => {
    expect(formatShiftTime(base.startsAt, base.endsAt, 'en')).toMatch(/Monday, November 16, 6:00\s*p\.?m\.? to 8:00\s*p\.?m\.?/i);
  });

  it('uses the 24-hour clock in French', () => {
    expect(formatShiftTime(base.startsAt, base.endsAt, 'fr')).toMatch(/lundi 16 novembre, de 18 h( 00)? à 20 h( 00)?/);
  });

  it('confirms the shift in English with the details and a link back', () => {
    const email = volunteerConfirmationEmail({ ...base, lang: 'en' });

    expect(email.subject).toBe("You're signed up: Timekeeper (Pierrefonds Oldtimers Tournament)");
    expect(email.text).toContain('Hi Pat');
    expect(email.text).toContain('Role: Timekeeper');
    expect(email.text).toContain('Where: CSSR (Île Bizard)');
    expect(email.text).toContain('https://site.example/tournaments/t1');
    expect(email.html).toContain('View the tournament');
  });

  it('confirms the shift in French', () => {
    const email = volunteerConfirmationEmail({ ...base, lang: 'fr' });

    expect(email.subject).toBe('Inscription confirmée : Timekeeper (Pierrefonds Oldtimers Tournament)');
    expect(email.text).toContain('Bonjour Pat');
    expect(email.text).toContain('Rôle : Timekeeper');
    expect(email.html).toContain('Voir le tournoi');
  });

  describe('bilingual shifts ("English | Français")', () => {
    const shift = {
      ...base,
      role: 'Timekeeper | Chronométreur',
      location: 'CSSR (Île Bizard)',
      description: 'For all games | Pour tous les matchs',
    };

    it('is entirely French for a French reader', () => {
      const email = volunteerConfirmationEmail({ ...shift, lang: 'fr' });

      expect(email.subject).toContain('Chronométreur');
      expect(email.text).toContain('Rôle : Chronométreur');
      expect(email.text).toContain('Détails : Pour tous les matchs');
      expect(email.text).not.toContain('Timekeeper');
      expect(email.text).not.toContain('For all games');
      expect(email.html).not.toContain('Timekeeper');
      expect(email.html).not.toContain(' | ');
    });

    it('is entirely English for an English reader', () => {
      const email = volunteerConfirmationEmail({ ...shift, lang: 'en' });

      expect(email.subject).toContain('Timekeeper');
      expect(email.text).toContain('Role: Timekeeper');
      expect(email.text).toContain('Details: For all games');
      expect(email.text).not.toContain('Chronométreur');
      expect(email.text).not.toContain('Pour tous les matchs');
    });
  });

  it('puts the space before the colon in every French label, including the link', () => {
    const email = volunteerConfirmationEmail({ ...base, lang: 'fr' });
    expect(email.text).toContain('Page du tournoi : https://site.example/tournaments/t1');
  });

  it('leaves out the location and details when there are none', () => {
    const email = volunteerConfirmationEmail({ ...base, location: null, lang: 'en' });
    expect(email.text).not.toContain('Where:');
    expect(email.text).not.toContain('Details:');
  });

  it('includes the details when there are some', () => {
    const email = volunteerConfirmationEmail({ ...base, description: 'For all games', lang: 'en' });
    expect(email.text).toContain('Details: For all games');
  });

  it('tells people to reply when there is a contact address, and to ask the organizers otherwise', () => {
    const withContact = volunteerConfirmationEmail({ ...base, contactEmail: 'org@example.com', lang: 'en' });
    const without = volunteerConfirmationEmail({ ...base, lang: 'en' });

    expect(withContact.text).toContain('just reply to this email');
    expect(without.text).toContain('let the tournament organizers know');
  });

  it('escapes anything a volunteer typed before putting it in the HTML', () => {
    const email = volunteerConfirmationEmail({ ...base, volunteerName: '<script>alert(1)</script>', lang: 'en' });

    expect(email.html).not.toContain('<script>');
    expect(email.html).toContain('&lt;script&gt;');
  });
});
