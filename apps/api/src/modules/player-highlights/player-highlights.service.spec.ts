jest.mock('../../prisma/prisma.service', () => ({ PrismaService: class {} }));
import { PlayerHighlightsService } from './player-highlights.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('PlayerHighlightsService', () => {
  const prisma = {
    tournament: { findUnique: jest.fn() },
    tournamentGamePlayerStat: { findMany: jest.fn() },
    league: { findUniqueOrThrow: jest.fn() },
    gameScoreSheetPlayer: { findMany: jest.fn() },
  };
  const service = new PlayerHighlightsService(
    prisma as unknown as PrismaService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.tournamentGamePlayerStat.findMany.mockResolvedValue([]);
    prisma.gameScoreSheetPlayer.findMany.mockResolvedValue([]);
  });

  it('limits public results to final games in the last 30 days and never queries league stats', async () => {
    await service.tournaments();
    const args = prisma.tournamentGamePlayerStat.findMany.mock.calls[0][0];
    expect(args.where.game.status).toBe('FINAL');
    expect(
      args.where.game.startsAt.lte.getTime() -
        args.where.game.startsAt.gte.getTime(),
    ).toBe(30 * 86400000);
    expect(prisma.gameScoreSheetPlayer.findMany).not.toHaveBeenCalled();
  });

  it('scopes tournament results and rejects nonexistent events', async () => {
    prisma.tournament.findUnique.mockResolvedValueOnce(null);
    await expect(service.tournaments('missing')).rejects.toThrow(
      'Tournament not found',
    );
    expect(prisma.tournamentGamePlayerStat.findMany).not.toHaveBeenCalled();
    prisma.tournament.findUnique.mockResolvedValueOnce({ name: 'Cup' });
    await service.tournaments('cup');
    expect(
      prisma.tournamentGamePlayerStat.findMany.mock.calls[0][0].where.game,
    ).toMatchObject({ tournamentId: 'cup', status: 'FINAL' });
  });

  it('uses finalized score sheets only and scopes them to the requested league', async () => {
    prisma.league.findUniqueOrThrow.mockResolvedValue({
      name: 'League',
      season: '2026',
    });
    const result = await service.league('league-1');
    expect(prisma.gameScoreSheetPlayer.findMany.mock.calls[0][0].where).toEqual(
      { scoreSheet: { leagueId: 'league-1', status: 'FINALIZED' } },
    );
    expect(result.scopeLabel).toBe('League · 2026');
  });
});
