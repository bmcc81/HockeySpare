import { mergeRecipients } from './thank-you-recipients';

describe('mergeRecipients', () => {
  it('keeps followers in their language and volunteers in both when unknown', () => {
    const result = mergeRecipients(
      [{ email: 'a@x.test', lang: 'fr' }],
      [{ email: 'b@x.test', name: 'Bea' }],
    );
    expect(result).toEqual([
      { email: 'a@x.test', lang: 'fr', name: null },
      { email: 'b@x.test', lang: 'both', name: 'Bea' },
    ]);
  });

  it('sends one email per address, using the follower language and the volunteer name', () => {
    const result = mergeRecipients(
      [{ email: 'A@x.test', lang: 'en' }],
      [{ email: ' a@X.test ', name: 'Al' }],
    );
    expect(result).toEqual([{ email: 'a@x.test', lang: 'en', name: 'Al' }]);
  });

  it('skips volunteers without an email and blank addresses', () => {
    expect(
      mergeRecipients([{ email: '  ', lang: 'en' }], [{ email: null, name: 'No Mail' }]),
    ).toEqual([]);
  });

  it('treats an unknown follower language as English', () => {
    expect(mergeRecipients([{ email: 'a@x.test', lang: 'de' }], [])[0].lang).toBe('en');
  });
});
