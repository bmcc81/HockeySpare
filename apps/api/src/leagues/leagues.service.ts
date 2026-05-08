import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeagueDto } from './dto/create-league.dto';
import { CreateLeagueTeamDto } from './dto/create-league-team.dto';
import { CreateLeagueGameDto } from './dto/create-league-game.dto';
import { CreateLeagueArenaDto } from './dto/create-league-arena.dto';

@Injectable()
export class LeaguesService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string) {
    return this.prisma.league.findMany({
      where: {
        OR: [
          {
            members: {
              some: {
                userId,
              },
            },
          },
          {
            teams: {
              some: {
                createdById: userId,
              },
            },
          },
          {
            teams: {
              some: {
                members: {
                  some: {
                    userId,
                    isActive: true,
                  },
                },
              },
            },
          },
        ],
      },
      include: {
        members: true,
        teams: {
          include: {
            games: {
              orderBy: {
                startsAt: 'asc',
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async create(userId: string, dto: CreateLeagueDto) {
    const league = await this.prisma.league.create({
      data: {
        name: dto.name.trim(),
        season: dto.season?.trim() || null,
        members: {
          create: {
            userId,
            role: 'LEAGUE_MANAGER',
          },
        },
      },
    });

    await this.autoLinkManagedTeamToLeague(userId, league.id);

    return this.getById(userId, league.id);
  }

  async getById(userId: string, leagueId: string) {
    await this.assertUserCanAccessLeague(userId, leagueId);

    const league = await this.prisma.league.findUnique({
      where: {
        id: leagueId,
      },
      include: {
        members: true,
        arenas: {
          orderBy: {
            name: 'asc',
          },
        },
        teams: {
          include: {
            games: {
              orderBy: {
                startsAt: 'asc',
              },
            },
            members: {
              where: {
                isActive: true,
              },
              orderBy: {
                displayName: 'asc',
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        },
      },
    });

    if (!league) {
      throw new NotFoundException('League not found');
    }

    return league;
  }

  async addArena(userId: string, leagueId: string, dto: CreateLeagueArenaDto) {
    await this.assertUserCanAddTeamToLeague(userId, leagueId);

    const name = dto.name.trim();

    if (!name) {
      throw new BadRequestException('Arena name is required');
    }

    return this.prisma.leagueArena.create({
      data: {
        leagueId,
        name,
        address: dto.address?.trim() || null,
      },
    });
  }

  async listTeams(userId: string, leagueId: string) {
    await this.assertUserCanAccessLeague(userId, leagueId);

    return this.prisma.team.findMany({
      where: {
        leagueId,
      },
      include: {
        games: {
          orderBy: {
            startsAt: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async listGames(userId: string, leagueId: string) {
    await this.assertUserCanAccessLeague(userId, leagueId);

    const teams = await this.prisma.team.findMany({
      where: {
        leagueId,
      },
      include: {
        games: {
          orderBy: {
            startsAt: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return teams.flatMap((team) =>
      team.games.map((game) => ({
        ...game,
        teamName: team.name,
      })),
    );
  }

  private async assertUserCanManageLeagueTeam(
    userId: string,
    leagueId: string,
    teamId: string,
  ): Promise<void> {
    const team = await this.prisma.team.findFirst({
      where: {
        id: teamId,
        leagueId,
      },
      select: {
        id: true,
        createdById: true,
      },
    });

    if (!team) {
      throw new NotFoundException('Team not found in this league');
    }

    const canManageLeague = await this.prisma.league.findFirst({
      where: {
        id: leagueId,
        OR: [
          {
            members: {
              some: {
                userId,
                role: 'LEAGUE_MANAGER',
              },
            },
          },
          {
            teams: {
              some: {
                id: teamId,
                createdById: userId,
              },
            },
          },
          {
            teams: {
              some: {
                id: teamId,
                members: {
                  some: {
                    userId,
                    isActive: true,
                    role: {
                      in: ['CAPTAIN', 'GENERAL_MANAGER'],
                    },
                  },
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
      },
    });

    if (!canManageLeague) {
      throw new ForbiddenException(
        'Only a league manager, team owner, General Manager, or Captain can schedule games for this team.',
      );
    }
  }

  async addGame(
    userId: string,
    leagueId: string,
    teamId: string,
    dto: CreateLeagueGameDto,
  ) {
    await this.assertUserCanManageLeagueTeam(userId, leagueId, teamId);

    const title = dto.title.trim();

    if (!title) {
      throw new BadRequestException('Game title is required');
    }

    const startsAt = new Date(dto.startsAt);

    if (Number.isNaN(startsAt.getTime())) {
      throw new BadRequestException('Valid start time is required');
    }

    return this.prisma.teamGame.create({
      data: {
        teamId,
        title,
        startsAt,
        arena: dto.arena?.trim() || null,
        opponent: dto.opponent?.trim() || null,
        notes: dto.notes?.trim() || null,
      },
    });
  }

  async addTeam(userId: string, leagueId: string, dto: CreateLeagueTeamDto) {
    await this.assertUserCanAddTeamToLeague(userId, leagueId);

    const name = dto.name.trim();

    if (!name) {
      throw new BadRequestException('Team name is required');
    }

    const existingLeagueTeam = await this.prisma.team.findFirst({
      where: {
        leagueId,
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
      include: {
        games: {
          orderBy: {
            startsAt: 'asc',
          },
        },
      },
    });

    if (existingLeagueTeam) {
      return existingLeagueTeam;
    }

    const managedMembership = await this.prisma.teamMember.findFirst({
      where: {
        userId,
        isActive: true,
        role: {
          in: ['CAPTAIN', 'GENERAL_MANAGER'],
        },
        team: {
          name: {
            equals: name,
            mode: 'insensitive',
          },
        },
      },
      include: {
        team: {
          include: {
            games: {
              orderBy: {
                startsAt: 'asc',
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (managedMembership) {
      return this.prisma.team.update({
        where: {
          id: managedMembership.teamId,
        },
        data: {
          leagueId,
          name,
        },
        include: {
          games: {
            orderBy: {
              startsAt: 'asc',
            },
          },
        },
      });
    }

    return this.prisma.team.create({
      data: {
        name,
        leagueId,
        createdById: userId,
      },
      include: {
        games: {
          orderBy: {
            startsAt: 'asc',
          },
        },
      },
    });
  }

  private async assertUserCanAddTeamToLeague(
    userId: string,
    leagueId: string,
  ): Promise<void> {
    const league = await this.prisma.league.findUnique({
      where: {
        id: leagueId,
      },
      select: {
        id: true,
      },
    });

    if (!league) {
      throw new NotFoundException('League not found');
    }

    const access = await this.prisma.league.findFirst({
      where: {
        id: leagueId,
        OR: [
          {
            members: {
              some: {
                userId,
                role: 'LEAGUE_MANAGER',
              },
            },
          },
          {
            teams: {
              some: {
                members: {
                  some: {
                    userId,
                    isActive: true,
                    role: {
                      in: ['CAPTAIN', 'GENERAL_MANAGER'],
                    },
                  },
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
      },
    });

    if (!access) {
      throw new ForbiddenException(
        'Only a league manager, General Manager, or Captain can add teams.',
      );
    }
  }

  async linkMyTeamToLeague(leagueId: string, userId: string) {
    const league = await this.prisma.league.findUnique({
      where: {
        id: leagueId,
      },
    });

    if (!league) {
      throw new NotFoundException('League not found');
    }

    const membership = await this.prisma.teamMember.findFirst({
      where: {
        userId,
        isActive: true,
        role: {
          in: ['CAPTAIN', 'GENERAL_MANAGER'],
        },
      },
      include: {
        team: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (!membership) {
      throw new ForbiddenException('You do not manage a team.');
    }

    return this.prisma.team.update({
      where: {
        id: membership.teamId,
      },
      data: {
        leagueId,
      },
      include: {
        league: true,
        members: {
          where: {
            isActive: true,
          },
          orderBy: {
            displayName: 'asc',
          },
        },
        games: {
          orderBy: {
            startsAt: 'asc',
          },
          include: {
            invites: {
              include: {
                member: true,
              },
            },
            availabilities: {
              include: {
                member: true,
              },
            },
          },
        },
      },
    });
  }

  private async autoLinkManagedTeamToLeague(
    userId: string,
    leagueId: string,
  ): Promise<void> {
    const membership = await this.prisma.teamMember.findFirst({
      where: {
        userId,
        isActive: true,
        role: {
          in: ['CAPTAIN', 'GENERAL_MANAGER'],
        },
      },
      include: {
        team: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (!membership) {
      return;
    }

    const team = membership.team;

    if (team.leagueId && team.leagueId !== leagueId) {
      return;
    }

    if (team.leagueId === leagueId) {
      return;
    }

    await this.prisma.team.update({
      where: {
        id: team.id,
      },
      data: {
        leagueId,
      },
    });
  }

  private async assertUserCanAccessLeague(
    userId: string,
    leagueId: string,
  ): Promise<void> {
    const league = await this.prisma.league.findUnique({
      where: {
        id: leagueId,
      },
      select: {
        id: true,
      },
    });

    if (!league) {
      throw new NotFoundException('League not found');
    }

    const access = await this.prisma.league.findFirst({
      where: {
        id: leagueId,
        OR: [
          {
            members: {
              some: {
                userId,
              },
            },
          },
          {
            teams: {
              some: {
                createdById: userId,
              },
            },
          },
          {
            teams: {
              some: {
                members: {
                  some: {
                    userId,
                    isActive: true,
                  },
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
      },
    });

    if (!access) {
      throw new ForbiddenException('You do not have access to this league');
    }
  }

  async deleteGame(
    userId: string,
    leagueId: string,
    teamId: string,
    gameId: string,
  ) {
    await this.assertUserCanManageLeagueTeam(userId, leagueId, teamId);

    const game = await this.prisma.teamGame.findFirst({
      where: {
        id: gameId,
        teamId,
        team: {
          leagueId,
        },
      },
      select: {
        id: true,
        title: true,
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found in this league team');
    }

    await this.prisma.teamGame.delete({
      where: {
        id: game.id,
      },
    });

    return {
      id: game.id,
      title: game.title,
      deleted: true,
    };
  }
}
