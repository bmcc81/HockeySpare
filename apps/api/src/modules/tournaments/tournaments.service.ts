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
import { CreateTournamentRegistrationDto } from './dto/create-tournament-registration.dto';
import { CreateTournamentSponsorDto } from './dto/create-tournament-sponsor.dto';

@Injectable()
export class TournamentsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly tournamentInclude = {
    games: {
      orderBy: {
        startsAt: 'asc' as const,
      },
    },
    sponsors: {
      orderBy: {
        createdAt: 'asc' as const,
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
        ...(dto.homeScore !== undefined ? { homeScore: dto.homeScore } : {}),
        ...(dto.awayScore !== undefined ? { awayScore: dto.awayScore } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
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

  // Public - no ownership check. Anyone with the tournament link can submit
  // a registration; only the creator can view/manage the submitted list.
  async submitRegistration(
    tournamentId: string,
    dto: CreateTournamentRegistrationDto,
  ) {
    const tournament = await this.prisma.tournament.findUnique({
      where: {
        id: tournamentId,
      },
      select: {
        id: true,
      },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    return this.prisma.tournamentRegistration.create({
      data: {
        tournamentId,
        teamName: dto.teamName.trim(),
        division: dto.division?.trim() || null,
        contactName: dto.contactName.trim(),
        contactEmail: dto.contactEmail.trim().toLowerCase(),
        contactPhone: dto.contactPhone?.trim() || null,
        notes: dto.notes?.trim() || null,
      },
    });
  }

  async listRegistrations(userId: string, tournamentId: string) {
    await this.getOwnedTournament(userId, tournamentId);

    return this.prisma.tournamentRegistration.findMany({
      where: {
        tournamentId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async deleteRegistration(
    userId: string,
    tournamentId: string,
    registrationId: string,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    const registration = await this.prisma.tournamentRegistration.findFirst({
      where: {
        id: registrationId,
        tournamentId,
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    await this.prisma.tournamentRegistration.delete({
      where: {
        id: registrationId,
      },
    });

    return {
      id: registration.id,
      deleted: true,
    };
  }

  async addSponsor(
    userId: string,
    tournamentId: string,
    dto: CreateTournamentSponsorDto,
  ) {
    await this.getOwnedTournament(userId, tournamentId);

    return this.prisma.tournamentSponsor.create({
      data: {
        tournamentId,
        name: dto.name.trim(),
        logoUrl: dto.logoUrl?.trim() || null,
        linkUrl: dto.linkUrl?.trim() || null,
      },
    });
  }

  async deleteSponsor(userId: string, tournamentId: string, sponsorId: string) {
    await this.getOwnedTournament(userId, tournamentId);

    const sponsor = await this.prisma.tournamentSponsor.findFirst({
      where: {
        id: sponsorId,
        tournamentId,
      },
    });

    if (!sponsor) {
      throw new NotFoundException('Sponsor not found');
    }

    await this.prisma.tournamentSponsor.delete({
      where: {
        id: sponsorId,
      },
    });

    return {
      id: sponsor.id,
      deleted: true,
    };
  }
}
