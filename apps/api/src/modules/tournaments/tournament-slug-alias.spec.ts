jest.mock('../../prisma/prisma.service', () => ({ PrismaService: class {} }));
import { TournamentsService } from './tournaments.service';

function makeService(prisma: Record<string, unknown>) {
  return new TournamentsService(prisma as never, {} as never, {} as never, {} as never, {} as never);
}

const START = new Date('2026-11-16T00:00:00.000Z');

describe('TournamentsService.resolveSlug', () => {
  const tournaments = [{ id: 't1', name: 'Pierrefonds Oldtimers Tournament', startDate: START }];

  it('finds a tournament by its current address', async () => {
    const alias = { findUnique: jest.fn() };
    const service = makeService({
      tournament: { findMany: jest.fn().mockResolvedValue(tournaments) },
      tournamentSlugAlias: alias,
    });

    await expect(service.resolveSlug('pierrefonds-oldtimers-tournament-2026-11-16')).resolves.toBe('t1');
    expect(alias.findUnique).not.toHaveBeenCalled();
  });

  it('finds a tournament by an address it had before a rename', async () => {
    const service = makeService({
      tournament: { findMany: jest.fn().mockResolvedValue(tournaments) },
      tournamentSlugAlias: { findUnique: jest.fn().mockResolvedValue({ tournamentId: 't1' }) },
    });

    await expect(service.resolveSlug('old-name-2026-11-16')).resolves.toBe('t1');
  });

  it('prefers a current address over an old one that points elsewhere', async () => {
    const service = makeService({
      tournament: { findMany: jest.fn().mockResolvedValue(tournaments) },
      tournamentSlugAlias: { findUnique: jest.fn().mockResolvedValue({ tournamentId: 'other' }) },
    });

    await expect(service.resolveSlug('pierrefonds-oldtimers-tournament-2026-11-16')).resolves.toBe('t1');
  });

  it('returns null for an unknown address', async () => {
    const service = makeService({
      tournament: { findMany: jest.fn().mockResolvedValue(tournaments) },
      tournamentSlugAlias: { findUnique: jest.fn().mockResolvedValue(null) },
    });

    await expect(service.resolveSlug('nothing-here')).resolves.toBeNull();
  });

  it('still answers when the old-address table is missing', async () => {
    const service = makeService({
      tournament: { findMany: jest.fn().mockResolvedValue(tournaments) },
      tournamentSlugAlias: { findUnique: jest.fn().mockRejectedValue(new Error('no such table')) },
    });

    await expect(service.resolveSlug('nothing-here')).resolves.toBeNull();
  });
});

describe('TournamentsService.update keeps the old address', () => {
  function setup(alias: Record<string, unknown>, updatedName: string, updatedStart: Date | null = START) {
    const before = {
      id: 't1',
      name: 'Pierrefonds Oldtimers Tournament',
      startDate: START,
      createdById: 'u1',
    };
    const prisma = {
      tournament: {
        findUnique: jest.fn().mockResolvedValue(before),
        update: jest.fn().mockResolvedValue({ ...before, name: updatedName, startDate: updatedStart }),
      },
      tournamentAuditLogEntry: { create: jest.fn().mockResolvedValue({}) },
      tournamentSlugAlias: alias,
    };
    return makeService(prisma);
  }

  it('saves the old address when the name changes', async () => {
    const createMany = jest.fn().mockResolvedValue({ count: 1 });
    const service = setup({ createMany }, 'Pierrefonds Oldtimers Classic');

    await service.update('u1', 't1', { name: 'Pierrefonds Oldtimers Classic' } as never);

    expect(createMany).toHaveBeenCalledWith({
      data: [{ slug: 'pierrefonds-oldtimers-tournament-2026-11-16', tournamentId: 't1' }],
      skipDuplicates: true,
    });
  });

  it('saves the old address when the start date changes', async () => {
    const createMany = jest.fn().mockResolvedValue({ count: 1 });
    const service = setup({ createMany }, 'Pierrefonds Oldtimers Tournament', new Date('2026-11-17T00:00:00.000Z'));

    await service.update('u1', 't1', { startDate: '2026-11-17' } as never);

    expect(createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [{ slug: 'pierrefonds-oldtimers-tournament-2026-11-16', tournamentId: 't1' }],
      }),
    );
  });

  it('saves nothing when the address did not change', async () => {
    const createMany = jest.fn();
    const service = setup({ createMany }, 'Pierrefonds Oldtimers Tournament');

    await service.update('u1', 't1', { description: 'New text' } as never);

    expect(createMany).not.toHaveBeenCalled();
  });

  it('does not block the edit if the old address cannot be saved', async () => {
    const createMany = jest.fn().mockRejectedValue(new Error('no such table'));
    const service = setup({ createMany }, 'Pierrefonds Oldtimers Classic');

    await expect(
      service.update('u1', 't1', { name: 'Pierrefonds Oldtimers Classic' } as never),
    ).resolves.toMatchObject({ name: 'Pierrefonds Oldtimers Classic' });
  });
});
