jest.mock('../../prisma/prisma.service', () => ({ PrismaService: class {} }));
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';

// The service only touches prisma here, so the other collaborators are stubs.
function makeService(
  prisma: Record<string, unknown>,
  email: Record<string, unknown> = { isConfigured: false },
) {
  return new TournamentsService(
    prisma as never,
    {} as never,
    email as never,
    {} as never,
    {} as never,
  );
}

const START = new Date('2026-11-16T23:00:00Z');
const END = new Date('2026-11-17T01:00:00Z');

function shift(overrides: Record<string, unknown> = {}) {
  return {
    id: 'shift1',
    tournamentId: 't1',
    role: 'Timekeeper',
    startsAt: START,
    endsAt: END,
    capacity: 1,
    _count: { signups: 0 },
    location: 'CSSR (Île Bizard)',
    description: null,
    tournament: {
      volunteersOpen: true,
      name: 'Pierrefonds Oldtimers Tournament',
      contactEmail: null,
    },
    ...overrides,
  };
}

describe('TournamentsService volunteers', () => {
  describe('getPublic', () => {
    const base = { id: 't1', volunteerShifts: [shift()] };

    it('hides the shifts while volunteer sign-up is closed', async () => {
      const service = makeService({
        tournament: {
          findUnique: jest
            .fn()
            .mockResolvedValue({ ...base, volunteersOpen: false }),
        },
      });

      const result = await service.getPublic('t1');
      expect(result.volunteerShifts).toEqual([]);
    });

    it('shows the shifts once sign-up is open', async () => {
      const service = makeService({
        tournament: {
          findUnique: jest
            .fn()
            .mockResolvedValue({ ...base, volunteersOpen: true }),
        },
      });

      const result = await service.getPublic('t1');
      expect(result.volunteerShifts).toHaveLength(1);
    });
  });

  describe('signUpForVolunteerShift', () => {
    const dto = { name: 'Pat', email: 'Pat@Example.com' };

    function prismaWith(opts: {
      shift: unknown;
      clash?: unknown;
    }) {
      const create = jest.fn().mockResolvedValue({ id: 's1' });
      return {
        create,
        prisma: {
          tournamentVolunteerShift: {
            findFirst: jest.fn().mockResolvedValue(opts.shift),
          },
          tournamentVolunteerSignup: {
            findFirst: jest.fn().mockResolvedValue(opts.clash ?? null),
            create,
          },
        },
      };
    }

    it('refuses while sign-up is closed, as if the shift did not exist', async () => {
      const { prisma } = prismaWith({
        shift: shift({
          tournament: { volunteersOpen: false, name: 'T', contactEmail: null },
        }),
      });

      await expect(
        makeService(prisma).signUpForVolunteerShift('t1', 'shift1', dto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('refuses a full shift', async () => {
      const { prisma } = prismaWith({
        shift: shift({ capacity: 1, _count: { signups: 1 } }),
      });

      await expect(
        makeService(prisma).signUpForVolunteerShift('t1', 'shift1', dto),
      ).rejects.toThrow('already full');
    });

    it('refuses signing up twice for the same shift', async () => {
      const { prisma } = prismaWith({
        shift: shift({ capacity: 3 }),
        clash: { shift: { id: 'shift1' } },
      });

      await expect(
        makeService(prisma).signUpForVolunteerShift('t1', 'shift1', dto),
      ).rejects.toThrow('already signed up for this shift');
    });

    it('refuses a second shift at the same time', async () => {
      const { prisma } = prismaWith({
        shift: shift({ capacity: 3 }),
        clash: { shift: { id: 'other' } },
      });

      await expect(
        makeService(prisma).signUpForVolunteerShift('t1', 'shift1', dto),
      ).rejects.toThrow('another shift at the same time');
    });

    it('saves a valid signup with a lower-cased email', async () => {
      const { prisma, create } = prismaWith({ shift: shift({ capacity: 3 }) });

      await makeService(prisma).signUpForVolunteerShift('t1', 'shift1', dto);

      expect(create).toHaveBeenCalledWith({
        data: {
          shiftId: 'shift1',
          name: 'Pat',
          email: 'pat@example.com',
          phone: null,
        },
      });
    });
  });

  describe('confirmation email', () => {
    const dto = { name: 'Pat', email: 'Pat@Example.com', lang: 'fr' as const };

    function setup(email: Record<string, unknown>) {
      const prisma = {
        tournamentVolunteerShift: {
          findFirst: jest.fn().mockResolvedValue(shift({ capacity: 3 })),
        },
        tournamentVolunteerSignup: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ id: 's1', name: 'Pat' }),
        },
      };
      return makeService(prisma, email);
    }

    it('emails the volunteer their shift in their language', async () => {
      const sendMail = jest.fn().mockResolvedValue(undefined);
      const service = setup({
        isConfigured: true,
        getAppUrl: () => 'https://site.example',
        sendMail,
      });

      const result = await service.signUpForVolunteerShift('t1', 'shift1', dto);

      expect(result.confirmationEmailSent).toBe(true);
      expect(sendMail).toHaveBeenCalledTimes(1);
      const sent = sendMail.mock.calls[0][0];
      expect(sent.to).toBe('pat@example.com');
      expect(sent.subject).toContain('Inscription confirmée');
      expect(sent.headers).toBeUndefined();
    });

    it('sets Reply-To when the tournament has a contact address', async () => {
      const sendMail = jest.fn().mockResolvedValue(undefined);
      const prisma = {
        tournamentVolunteerShift: {
          findFirst: jest.fn().mockResolvedValue(
            shift({
              capacity: 3,
              tournament: {
                volunteersOpen: true,
                name: 'T',
                contactEmail: 'org@example.com',
              },
            }),
          ),
        },
        tournamentVolunteerSignup: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ id: 's1', name: 'Pat' }),
        },
      };

      await makeService(prisma, {
        isConfigured: true,
        getAppUrl: () => 'https://site.example',
        sendMail,
      }).signUpForVolunteerShift('t1', 'shift1', { name: 'Pat', email: 'p@x.com' });

      expect(sendMail.mock.calls[0][0].headers).toEqual({
        'Reply-To': 'org@example.com',
      });
    });

    it('still saves the signup when mail is not set up', async () => {
      const sendMail = jest.fn();
      const service = setup({ isConfigured: false, sendMail });

      const result = await service.signUpForVolunteerShift('t1', 'shift1', dto);

      expect(result.id).toBe('s1');
      expect(result.confirmationEmailSent).toBe(false);
      expect(sendMail).not.toHaveBeenCalled();
    });

    it('still saves the signup when the mail server fails', async () => {
      const service = setup({
        isConfigured: true,
        getAppUrl: () => 'https://site.example',
        sendMail: jest.fn().mockRejectedValue(new Error('535 auth failed')),
      });

      const result = await service.signUpForVolunteerShift('t1', 'shift1', dto);

      expect(result.id).toBe('s1');
      expect(result.confirmationEmailSent).toBe(false);
    });
  });

  describe('organizer actions', () => {
    // Owner of the tournament, so the manage check passes.
    const tournamentRow = { id: 't1', createdById: 'org1' };

    function prismaFor(extra: Record<string, unknown>) {
      return {
        tournament: { findUnique: jest.fn().mockResolvedValue(tournamentRow) },
        tournamentAuditLogEntry: { create: jest.fn() },
        ...extra,
      };
    }

    it('adds a name without an email', async () => {
      const create = jest
        .fn()
        .mockResolvedValue({ id: 's1', name: 'Chris', shiftId: 'shift1' });
      const service = makeService(
        prismaFor({
          tournamentVolunteerShift: {
            findFirst: jest.fn().mockResolvedValue(shift({ capacity: 2 })),
          },
          tournamentVolunteerSignup: { create },
        }),
      );

      await service.addVolunteerToShift('org1', 't1', 'shift1', {
        name: ' Chris ',
      });

      expect(create).toHaveBeenCalledWith({
        data: { shiftId: 'shift1', name: 'Chris', email: null, phone: null },
      });
    });

    it('does not email people an organizer adds', async () => {
      const sendMail = jest.fn();
      const service = makeService(
        prismaFor({
          tournamentVolunteerShift: {
            findFirst: jest.fn().mockResolvedValue(shift({ capacity: 2 })),
          },
          tournamentVolunteerSignup: {
            create: jest.fn().mockResolvedValue({ id: 's1', name: 'Pat' }),
          },
        }),
        { isConfigured: true, sendMail },
      );

      await service.addVolunteerToShift('org1', 't1', 'shift1', {
        name: 'Pat',
        email: 'pat@example.com',
      });

      expect(sendMail).not.toHaveBeenCalled();
    });

    it('will not add a name to a full shift', async () => {
      const service = makeService(
        prismaFor({
          tournamentVolunteerShift: {
            findFirst: jest
              .fn()
              .mockResolvedValue(shift({ capacity: 1, _count: { signups: 1 } })),
          },
          tournamentVolunteerSignup: { create: jest.fn() },
        }),
      );

      await expect(
        service.addVolunteerToShift('org1', 't1', 'shift1', { name: 'Chris' }),
      ).rejects.toThrow('already full');
    });

    it('removes a signup that belongs to the tournament', async () => {
      const del = jest.fn();
      const service = makeService(
        prismaFor({
          tournamentVolunteerSignup: {
            findFirst: jest.fn().mockResolvedValue({
              id: 'su1',
              name: 'Chris',
              shift: { role: 'Supervisor' },
            }),
            delete: del,
          },
        }),
      );

      const result = await service.removeVolunteerSignup(
        'org1',
        't1',
        'shift1',
        'su1',
      );

      expect(del).toHaveBeenCalledWith({ where: { id: 'su1' } });
      expect(result).toEqual({ id: 'su1', deleted: true });
    });

    it('will not shrink a shift below the people already on it', async () => {
      const service = makeService(
        prismaFor({
          tournamentVolunteerShift: {
            findFirst: jest
              .fn()
              .mockResolvedValue(shift({ capacity: 3, _count: { signups: 3 } })),
            update: jest.fn(),
          },
        }),
      );

      await expect(
        service.updateVolunteerShift('org1', 't1', 'shift1', { capacity: 2 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('will not end a shift before it starts', async () => {
      const service = makeService(
        prismaFor({
          tournamentVolunteerShift: {
            findFirst: jest.fn().mockResolvedValue(shift()),
            update: jest.fn(),
          },
        }),
      );

      await expect(
        service.updateVolunteerShift('org1', 't1', 'shift1', {
          endsAt: '2026-11-16T22:00:00Z',
        }),
      ).rejects.toThrow('must end after it starts');
    });

    it('can clear a shift capacity with null', async () => {
      const update = jest.fn().mockResolvedValue(shift({ capacity: null }));
      const service = makeService(
        prismaFor({
          tournamentVolunteerShift: {
            findFirst: jest.fn().mockResolvedValue(shift({ capacity: 3 })),
            update,
          },
        }),
      );

      await service.updateVolunteerShift('org1', 't1', 'shift1', {
        capacity: null,
      });

      expect(update.mock.calls[0][0].data).toEqual({ capacity: null });
    });
  });
});
