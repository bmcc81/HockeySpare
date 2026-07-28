import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LeagueRole, ScoreSheetStatus } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateScoreSheetDto } from './dto/update-score-sheet.dto';
import { UpsertScoreSheetPlayerDto } from './dto/upsert-score-sheet-player.dto';

type ScoreSheetPeriodScores = {
  teamPeriod1Score?: number;
  teamPeriod2Score?: number;
  teamPeriod3Score?: number;
  teamOvertimeScore?: number;
  opponentPeriod1Score?: number;
  opponentPeriod2Score?: number;
  opponentPeriod3Score?: number;
  opponentOvertimeScore?: number;
};

@Injectable()
export class ScoreSheetsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly scoreSheetInclude = {
    game: {
      include: {
        team: true,
        opponentTeam: true,
        arena: true,
        league: true,
      },
    },
    league: true,
    team: true,
    finalizedBy: {
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    },
    playerLines: {
      include: {
        member: {
          include: {
            team: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc' as const,
      },
    },
  };

  private async assertCanManageScoreSheet(userId: string, leagueId: string) {
    const membership = await this.prisma.leagueMember.findFirst({
      where: {
        userId,
        leagueId,
        role: {
          in: [LeagueRole.LEAGUE_MANAGER, LeagueRole.TIMEKEEPER],
        },
      },
      select: {
        id: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'Only a League GM or Timekeeper can manage this scoresheet.',
      );
    }
  }

  private assertDraft(status: ScoreSheetStatus) {
    if (status === ScoreSheetStatus.FINALIZED) {
      throw new BadRequestException(
        'This scoresheet has already been finalized and cannot be edited.',
      );
    }
  }

  private async getGameOrThrow(gameId: string) {
    const game = await this.prisma.teamGame.findUnique({
      where: {
        id: gameId,
      },
      include: {
        league: true,
        team: true,
        opponentTeam: true,
        arena: true,
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found.');
    }

    if (!game.leagueId) {
      throw new BadRequestException(
        'Scoresheets are only available for league games.',
      );
    }

    return game;
  }

  private async getScoreSheetOrThrow(scoreSheetId: string) {
    const scoreSheet = await this.prisma.gameScoreSheet.findUnique({
      where: {
        id: scoreSheetId,
      },
      include: this.scoreSheetInclude,
    });

    if (!scoreSheet) {
      throw new NotFoundException('Scoresheet not found.');
    }

    return scoreSheet;
  }

  private getSeasonFromScoreSheet(scoreSheet: {
    league: { season: string | null };
    game: { startsAt: Date };
  }) {
    if (scoreSheet.league.season) {
      return scoreSheet.league.season;
    }

    const startYear = scoreSheet.game.startsAt.getFullYear();
    return `${startYear}-${startYear + 1}`;
  }

  private getPeriodScoreData(
    dto: UpdateScoreSheetDto,
    fallback?: ScoreSheetPeriodScores,
  ) {
    const teamPeriod1Score =
      dto.teamPeriod1Score ?? fallback?.teamPeriod1Score ?? 0;
    const teamPeriod2Score =
      dto.teamPeriod2Score ?? fallback?.teamPeriod2Score ?? 0;
    const teamPeriod3Score =
      dto.teamPeriod3Score ?? fallback?.teamPeriod3Score ?? 0;
    const teamOvertimeScore =
      dto.teamOvertimeScore ?? fallback?.teamOvertimeScore ?? 0;

    const opponentPeriod1Score =
      dto.opponentPeriod1Score ?? fallback?.opponentPeriod1Score ?? 0;
    const opponentPeriod2Score =
      dto.opponentPeriod2Score ?? fallback?.opponentPeriod2Score ?? 0;
    const opponentPeriod3Score =
      dto.opponentPeriod3Score ?? fallback?.opponentPeriod3Score ?? 0;
    const opponentOvertimeScore =
      dto.opponentOvertimeScore ?? fallback?.opponentOvertimeScore ?? 0;

    return {
      teamPeriod1Score,
      teamPeriod2Score,
      teamPeriod3Score,
      teamOvertimeScore,
      opponentPeriod1Score,
      opponentPeriod2Score,
      opponentPeriod3Score,
      opponentOvertimeScore,
      teamScore:
        teamPeriod1Score +
        teamPeriod2Score +
        teamPeriod3Score +
        teamOvertimeScore,
      opponentScore:
        opponentPeriod1Score +
        opponentPeriod2Score +
        opponentPeriod3Score +
        opponentOvertimeScore,
    };
  }

  async getByGame(userId: string, gameId: string) {
    const game = await this.getGameOrThrow(gameId);

    await this.assertCanManageScoreSheet(userId, game.leagueId!);

    const scoreSheet = await this.prisma.gameScoreSheet.findUnique({
      where: {
        gameId: game.id,
      },
      include: this.scoreSheetInclude,
    });

    if (scoreSheet) {
      if (scoreSheet.status === ScoreSheetStatus.DRAFT) {
        await this.ensureScoreSheetPlayerLines(scoreSheet.id, [
          scoreSheet.teamId,
          scoreSheet.game.opponentTeamId ?? '',
        ]);
      }

      return this.getScoreSheetOrThrow(scoreSheet.id);
    }

    return {
      id: null,
      gameId: game.id,
      leagueId: game.leagueId,
      teamId: game.teamId,

      teamScore: 0,
      opponentScore: 0,

      teamPeriod1Score: 0,
      teamPeriod2Score: 0,
      teamPeriod3Score: 0,
      teamOvertimeScore: 0,

      opponentPeriod1Score: 0,
      opponentPeriod2Score: 0,
      opponentPeriod3Score: 0,
      opponentOvertimeScore: 0,

      status: ScoreSheetStatus.DRAFT,
      finalizedAt: null,
      finalizedById: null,
      notes: null,
      createdAt: null,
      updatedAt: null,
      game,
      league: game.league,
      team: game.team,
      finalizedBy: null,
      playerLines: [],
    };
  }

  async createForGame(
    userId: string,
    gameId: string,
    dto: UpdateScoreSheetDto,
  ) {
    const game = await this.getGameOrThrow(gameId);

    await this.assertCanManageScoreSheet(userId, game.leagueId!);

    const existing = await this.prisma.gameScoreSheet.findUnique({
      where: {
        gameId: game.id,
      },
      include: this.scoreSheetInclude,
    });

    if (existing) {
      if (existing.status === ScoreSheetStatus.DRAFT) {
        await this.ensureScoreSheetPlayerLines(existing.id, [
          existing.teamId,
          existing.game.opponentTeamId ?? '',
        ]);
      }

      return this.getScoreSheetOrThrow(existing.id);
    }

    const scoreData = this.getPeriodScoreData(dto);

    const scoreSheet = await this.prisma.gameScoreSheet.create({
      data: {
        gameId: game.id,
        leagueId: game.leagueId!,
        teamId: game.teamId,

        ...scoreData,

        notes: dto.notes?.trim() || null,
        status: ScoreSheetStatus.DRAFT,
      },
    });

    await this.ensureScoreSheetPlayerLines(scoreSheet.id, [
      game.teamId,
      game.opponentTeamId ?? '',
    ]);

    return this.getScoreSheetOrThrow(scoreSheet.id);
  }

  async updateScoreSheet(
    userId: string,
    scoreSheetId: string,
    dto: UpdateScoreSheetDto,
  ) {
    const scoreSheet = await this.getScoreSheetOrThrow(scoreSheetId);

    await this.assertCanManageScoreSheet(userId, scoreSheet.leagueId);
    this.assertDraft(scoreSheet.status);

    const scoreData = this.getPeriodScoreData(dto, {
      teamPeriod1Score: scoreSheet.teamPeriod1Score,
      teamPeriod2Score: scoreSheet.teamPeriod2Score,
      teamPeriod3Score: scoreSheet.teamPeriod3Score,
      teamOvertimeScore: scoreSheet.teamOvertimeScore,
      opponentPeriod1Score: scoreSheet.opponentPeriod1Score,
      opponentPeriod2Score: scoreSheet.opponentPeriod2Score,
      opponentPeriod3Score: scoreSheet.opponentPeriod3Score,
      opponentOvertimeScore: scoreSheet.opponentOvertimeScore,
    });

    await this.prisma.gameScoreSheet.update({
      where: {
        id: scoreSheet.id,
      },
      data: {
        ...scoreData,
        ...(dto.notes !== undefined
          ? {
              notes: dto.notes?.trim() || null,
            }
          : {}),
      },
    });

    return this.getScoreSheetOrThrow(scoreSheet.id);
  }

  async upsertPlayerLine(
    userId: string,
    scoreSheetId: string,
    dto: UpsertScoreSheetPlayerDto,
  ) {
    const scoreSheet = await this.getScoreSheetOrThrow(scoreSheetId);

    await this.assertCanManageScoreSheet(userId, scoreSheet.leagueId);
    this.assertDraft(scoreSheet.status);

    const allowedTeamIds = [
      scoreSheet.teamId,
      scoreSheet.game.opponentTeamId ?? '',
    ].filter(Boolean);

    const member = await this.prisma.teamMember.findFirst({
      where: {
        id: dto.memberId,
        teamId: {
          in: allowedTeamIds,
        },
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Team member not found.');
    }

    await this.prisma.gameScoreSheetPlayer.upsert({
      where: {
        scoreSheetId_memberId: {
          scoreSheetId: scoreSheet.id,
          memberId: member.id,
        },
      },
      update: {
        gamesPlayed: dto.gamesPlayed ?? 1,
        goals: dto.goals ?? 0,
        assists: dto.assists ?? 0,
        penaltyMins: dto.penaltyMins ?? 0,
      },
      create: {
        scoreSheetId: scoreSheet.id,
        memberId: member.id,
        gamesPlayed: dto.gamesPlayed ?? 1,
        goals: dto.goals ?? 0,
        assists: dto.assists ?? 0,
        penaltyMins: dto.penaltyMins ?? 0,
      },
    });

    return this.getScoreSheetOrThrow(scoreSheet.id);
  }

  async updatePlayerLine(
    userId: string,
    scoreSheetId: string,
    lineId: string,
    dto: UpsertScoreSheetPlayerDto,
  ) {
    const scoreSheet = await this.getScoreSheetOrThrow(scoreSheetId);

    await this.assertCanManageScoreSheet(userId, scoreSheet.leagueId);
    this.assertDraft(scoreSheet.status);

    const line = await this.prisma.gameScoreSheetPlayer.findFirst({
      where: {
        id: lineId,
        scoreSheetId: scoreSheet.id,
      },
    });

    if (!line) {
      throw new NotFoundException('Scoresheet player line not found.');
    }

    await this.prisma.gameScoreSheetPlayer.update({
      where: {
        id: line.id,
      },
      data: {
        ...(dto.gamesPlayed !== undefined
          ? {
              gamesPlayed: dto.gamesPlayed,
            }
          : {}),
        ...(dto.goals !== undefined
          ? {
              goals: dto.goals,
            }
          : {}),
        ...(dto.assists !== undefined
          ? {
              assists: dto.assists,
            }
          : {}),
        ...(dto.penaltyMins !== undefined
          ? {
              penaltyMins: dto.penaltyMins,
            }
          : {}),
      },
    });

    return this.getScoreSheetOrThrow(scoreSheet.id);
  }

  async deletePlayerLine(userId: string, scoreSheetId: string, lineId: string) {
    const scoreSheet = await this.getScoreSheetOrThrow(scoreSheetId);

    await this.assertCanManageScoreSheet(userId, scoreSheet.leagueId);
    this.assertDraft(scoreSheet.status);

    const line = await this.prisma.gameScoreSheetPlayer.findFirst({
      where: {
        id: lineId,
        scoreSheetId: scoreSheet.id,
      },
    });

    if (!line) {
      throw new NotFoundException('Scoresheet player line not found.');
    }

    await this.prisma.gameScoreSheetPlayer.delete({
      where: {
        id: line.id,
      },
    });

    return this.getScoreSheetOrThrow(scoreSheet.id);
  }

  async finalizeScoreSheet(userId: string, scoreSheetId: string) {
    const scoreSheet = await this.getScoreSheetOrThrow(scoreSheetId);

    await this.assertCanManageScoreSheet(userId, scoreSheet.leagueId);
    this.assertDraft(scoreSheet.status);

    const season = this.getSeasonFromScoreSheet(scoreSheet);

    await this.prisma.$transaction(async (tx) => {
      for (const line of scoreSheet.playerLines) {
        await tx.playerStat.upsert({
          where: {
            memberId_season: {
              memberId: line.memberId,
              season,
            },
          },
          update: {
            gamesPlayed: {
              increment: line.gamesPlayed,
            },
            goals: {
              increment: line.goals,
            },
            assists: {
              increment: line.assists,
            },
            penaltyMins: {
              increment: line.penaltyMins,
            },
            teamId: line.member.teamId,
            leagueId: scoreSheet.leagueId,
            ...(line.member.userId
              ? {
                  userId: line.member.userId,
                }
              : {}),
          },
          create: {
            memberId: line.memberId,
            userId: line.member.userId,
            teamId: line.member.teamId,
            leagueId: scoreSheet.leagueId,
            season,
            gamesPlayed: line.gamesPlayed,
            goals: line.goals,
            assists: line.assists,
            penaltyMins: line.penaltyMins,
          },
        });
      }

      await tx.gameScoreSheet.update({
        where: {
          id: scoreSheet.id,
        },
        data: {
          status: ScoreSheetStatus.FINALIZED,
          finalizedAt: new Date(),
          finalizedById: userId,
        },
      });
    });

    return this.getScoreSheetOrThrow(scoreSheet.id);
  }

  private async ensureScoreSheetPlayerLines(
    scoreSheetId: string,
    teamIds: string[],
  ) {
    const scoreSheet = await this.prisma.gameScoreSheet.findUnique({
      where: {
        id: scoreSheetId,
      },
      select: {
        status: true,
      },
    });

    if (!scoreSheet) {
      throw new NotFoundException('Scoresheet not found.');
    }

    this.assertDraft(scoreSheet.status);

    const uniqueTeamIds = [...new Set(teamIds.filter(Boolean))];

    if (uniqueTeamIds.length === 0) {
      return;
    }

    const members = await this.prisma.teamMember.findMany({
      where: {
        teamId: {
          in: uniqueTeamIds,
        },
        isActive: true,
      },
      select: {
        id: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (members.length === 0) {
      return;
    }

    await this.prisma.gameScoreSheetPlayer.createMany({
      data: members.map((member) => ({
        scoreSheetId,
        memberId: member.id,
        gamesPlayed: 1,
        goals: 0,
        assists: 0,
        penaltyMins: 0,
      })),
      skipDuplicates: true,
    });
  }
}
