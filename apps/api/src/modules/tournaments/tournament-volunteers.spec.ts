jest.mock('../../prisma/prisma.service', () => ({ PrismaService: class {} }));
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';

// The service only touches prisma here, so the other collaborators are stubs.
function makeService(prisma: Record<string, unknown>) {
  return new TournamentsService(
    prisma as never,
    {} as never,
    {} as never,
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
    tournament: { volunteersOpen: true },
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
        shift: shift({ tournament: { volunteersOpen: false } }),
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
