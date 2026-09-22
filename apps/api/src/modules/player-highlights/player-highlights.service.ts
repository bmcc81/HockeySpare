import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { buildHighlights } from './rank-players';

@Injectable()
export class PlayerHighlightsService {
  constructor(private readonly prisma: PrismaService) {}

  async tournaments(tournamentId?: string) {
    const tournament = tournamentId
      ? await this.prisma.tournament.findUnique({
          where: { id: tournamentId },
          select: { name: true },
        })
      : null;
    if (tournamentId && !tournament)
      throw new NotFoundException('Tournament not found');
    const now = new Date();
    // The public home board covers the last 30 days; event boards cover the full event.
    const stats = await this.prisma.tournamentGamePlayerStat.findMany({
      where: {
        game: {
          tournamentId,
          status: 'FINAL',
          startsAt: {
            lte: now,
            ...(!tournamentId
              ? { gte: new Date(now.getTime() - 30 * 86400000) }
              : {}),
          },
        },
      },
      select: {
        teamPlayerId: true,
        goals: true,
        assists: true,
        penaltyMins: true,
        game: {
          select: { startsAt: true, tournament: { select: { name: true } } },
        },
        teamPlayer: {
          select: {
            displayName: true,
            photoUrl: true,
            jerseyNumber: true,
            team: { select: { name: true } },
          },
        },
      },
    });
    return buildHighlights(
      stats.map((stat) => ({
        playerId: stat.teamPlayerId,
        photoUrl: stat.teamPlayer.photoUrl,
        jerseyNumber: stat.teamPlayer.jerseyNumber,
        displayName: stat.teamPlayer.displayName,
        teamName: stat.teamPlayer.team.name,
        competitionName: stat.game.tournament.name,
        playedAt: stat.game.startsAt,
        gamesPlayed: 1,
        goals: stat.goals,
        assists: stat.assists,
        penaltyMins: stat.penaltyMins,
      })),
      tournament?.name ?? 'Public tournaments · Last 30 days',
      now,
      tournamentId ? 50 : 10,
    );
  }

  // Call only after the league controller has checked membership/access.
  async league(leagueId: string) {
    const league = await this.prisma.league.findUniqueOrThrow({
      where: { id: leagueId },
      select: { name: true, season: true },
    });
    const stats = await this.prisma.gameScoreSheetPlayer.findMany({
      where: { scoreSheet: { leagueId, status: 'FINALIZED' } },
      select: {
        memberId: true,
        gamesPlayed: true,
        goals: true,
        assists: true,
        penaltyMins: true,
        member: { select: { displayName: true, photoUrl: true } },
        scoreSheet: {
          select: {
            game: { select: { startsAt: true } },
            team: { select: { name: true } },
          },
        },
      },
    });
    return buildHighlights(
      stats.map((stat) => ({
        playerId: stat.memberId,
        photoUrl: stat.member.photoUrl,
        displayName: stat.member.displayName,
        teamName: stat.scoreSheet.team.name,
        competitionName: league.name,
        playedAt: stat.scoreSheet.game.startsAt,
        gamesPlayed: stat.gamesPlayed,
        goals: stat.goals,
        assists: stat.assists,
        penaltyMins: stat.penaltyMins,
      })),
      [league.name, league.season].filter(Boolean).join(' · '),
      new Date(),
      50,
    );
  }
}
