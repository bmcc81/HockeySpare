import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { CreateTournamentGameDto } from './dto/create-tournament-game.dto';
import { UpdateTournamentGameDto } from './dto/update-tournament-game.dto';

@Injectable()
export class TournamentsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly tournamentInclude = {
    games: {
      orderBy: {
        startsAt: 'asc' as const,
      },
    },
  };

  private async getOwnedTournament(userId: string, tournamentId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: {
        id: tournamentId,
      },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    if (tournament.createdById !== userId) {
      throw new ForbiddenException(
        'Only the tournament creator can manage this tournament.',
      );
    }

    return tournament;
  }

  async create(userId: string, dto: CreateTournamentDto) {
    return this.prisma.tournament.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        rules: dto.rules?.trim() || null,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        leagueId: dto.leagueId || null,
        createdById: userId,
      },
      include: this.tournamentInclude,
    });
  }

  async listMine(userId: string) {
    return this.prisma.tournament.findMany({
      where: {
        createdById: userId,
      },
      include: this.tournamentInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getPublic(tournamentId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: {
        id: tournamentId,
      },
      include: this.tournamentInclude,
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    return tournament;
  }

  async update(userId: string, tournamentId: string, dto: UpdateTournamentDto) {
    await this.getOwnedTournament(userId, tournamentId);

    return this.prisma.tournament.update({
      where: {
        id: tournamentId,
      },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() || null }
          : {}),
        ...(dto.rules !== undefined ? { rules: dto.rules.trim() || null } : {}),
        ...(dto.startDate !== undefined
          ? { startDate: dto.startDate ? new Date(dto.startDate) : null }
          : {}),
        ...(dto.endDate !== undefined
          ? { endDate: dto.endDate ? new Date(dto.endDate) : null }
          : {}),
        ...(dto.leagueId !== undefined
          ? { leagueId: dto.leagueId || null }
          : {}),
      },
      include: this.tournamentInclude,
    });
  }

  async addGame(
    userId: string,
    tournamentId: string,
    dto: CreateTournamentGameDto,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    return this.prisma.tournamentGame.create({
      data: {
        tournamentId,
        homeTeamName: dto.homeTeamName.trim(),
        awayTeamName: dto.awayTeamName.trim(),
        startsAt: new Date(dto.startsAt),
        arenaName: dto.arenaName?.trim() || null,
        notes: dto.notes?.trim() || null,
      },
    });
  }

  async updateGame(
    userId: string,
    tournamentId: string,
    gameId: string,
    dto: UpdateTournamentGameDto,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const game = await this.prisma.tournamentGame.findFirst({
      where: {
        id: gameId,
        tournamentId,
      },
    });

    if (!game) {
      throw new NotFoundException('Tournament game not found');
    }

    return this.prisma.tournamentGame.update({
      where: {
        id: gameId,
      },
      data: {
        ...(dto.homeTeamName !== undefined
          ? { homeTeamName: dto.homeTeamName.trim() }
          : {}),
        ...(dto.awayTeamName !== undefined
          ? { awayTeamName: dto.awayTeamName.trim() }
          : {}),
        ...(dto.startsAt !== undefined
          ? { startsAt: new Date(dto.startsAt) }
          : {}),
        ...(dto.arenaName !== undefined
          ? { arenaName: dto.arenaName.trim() || null }
          : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes.trim() || null } : {}),
      },
    });
  }

  async deleteGame(userId: string, tournamentId: string, gameId: string) {
    await this.getOwnedTournament(userId, tournamentId);

    const game = await this.prisma.tournamentGame.findFirst({
      where: {
        id: gameId,
        tournamentId,
      },
    });

    if (!game) {
      throw new NotFoundException('Tournament game not found');
    }

    await this.prisma.tournamentGame.delete({
      where: {
        id: gameId,
      },
    });

    return {
      id: game.id,
      deleted: true,
    };
  }
}
