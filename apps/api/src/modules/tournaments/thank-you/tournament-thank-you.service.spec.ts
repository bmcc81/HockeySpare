jest.mock('../../../prisma/prisma.service', () => ({ PrismaService: class {} }));
jest.mock('../tournaments.service', () => ({ TournamentsService: class {} }));

import { TournamentThankYouService } from './tournament-thank-you.service';

function build(sendMail: jest.Mock) {
  const prisma = {
    tournamentTeamFollow: {
      findMany: jest.fn().mockResolvedValue([{ email: 'a@x.test', lang: 'fr' }]),
    },
    tournamentVolunteerSignup: {
      findMany: jest.fn().mockResolvedValue([{ email: 'b@x.test', name: 'Bea' }]),
    },
  };
  const email = { sendMail, isConfigured: true, getAppUrl: () => 'https://app.example.test' };
  const tournaments = {
    assertCanManageTournament: jest.fn().mockResolvedValue({ id: 't1', name: 'Cup' }),
  };
  const service = new TournamentThankYouService(prisma as never, email as never, tournaments as never);
  return { service, prisma, tournaments };
}

describe('TournamentThankYouService', () => {
  it('previews the number of people who would get the email', async () => {
    const { service, tournaments } = build(jest.fn());
    await expect(service.preview('u1', 't1')).resolves.toEqual({ recipients: 2, emailConfigured: true });
    expect(tournaments.assertCanManageTournament).toHaveBeenCalledWith('u1', 't1');
  });

  it('sends one email to each person and counts failures', async () => {
    const sendMail = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('bounce'));
    const { service } = build(sendMail);

    await expect(service.send('u1', 't1', 'See you next year')).resolves.toEqual({ sent: 1, failed: 1 });
    expect(sendMail).toHaveBeenCalledTimes(2);
    expect(sendMail.mock.calls[0][0].text).toContain('See you next year');
  });

  it('refuses a second send within the hour but allows one later', async () => {
    const { service } = build(jest.fn().mockResolvedValue(undefined));
    const start = 1_000_000;

    await service.send('u1', 't1', undefined, start);
    await expect(service.send('u1', 't1', undefined, start + 60_000)).rejects.toThrow(/already sent/);
    await expect(service.send('u1', 't1', undefined, start + 61 * 60_000)).resolves.toMatchObject({ sent: 2 });
  });
});
