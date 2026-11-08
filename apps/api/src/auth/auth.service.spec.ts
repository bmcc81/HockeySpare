jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

import { AuthService } from './auth.service';

function build(sendMail: jest.Mock) {
  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        id: 'u1',
        email: 'new@example.test',
        firstName: 'Sam',
        lastName: null,
        createdAt: new Date(),
        appRole: 'USER',
      }),
    },
    teamMember: { findMany: jest.fn().mockResolvedValue([]), updateMany: jest.fn() },
    $transaction: jest.fn(),
  };
  const jwt = { signAsync: jest.fn().mockResolvedValue('token') };
  const email = { sendMail, getAppUrl: () => 'https://app.example.test' };
  const service = new AuthService(prisma as never, jwt as never, email as never);
  // Linking pending team memberships is covered elsewhere; keep this test about the email.
  (service as unknown as { linkPendingTeamMemberships: () => Promise<void> }).linkPendingTeamMemberships =
    async () => undefined;
  return service;
}

const dto = { email: 'New@Example.test', password: 'password123', firstName: 'Sam', lastName: '' };

describe('AuthService.register welcome email', () => {
  it('sends a welcome email in the chosen language', async () => {
    const sendMail = jest.fn().mockResolvedValue(undefined);
    await build(sendMail).register({ ...dto, lang: 'fr' });
    await new Promise((r) => setImmediate(r));

    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail.mock.calls[0][0]).toMatchObject({
      to: 'new@example.test',
      subject: 'Bienvenue sur HockeySpare',
    });
  });

  it('defaults to English', async () => {
    const sendMail = jest.fn().mockResolvedValue(undefined);
    await build(sendMail).register(dto);
    await new Promise((r) => setImmediate(r));

    expect(sendMail.mock.calls[0][0].subject).toBe('Welcome to HockeySpare');
  });

  it('still signs the person up when the email fails', async () => {
    const sendMail = jest.fn().mockRejectedValue(new Error('smtp down'));
    const result = await build(sendMail).register(dto);
    await new Promise((r) => setImmediate(r));

    expect(result.accessToken).toBe('token');
  });
});
