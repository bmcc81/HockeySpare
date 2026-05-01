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

  async addTeam(userId: string, leagueId: string, dto: CreateLeagueTeamDto) {
    await this.assertUserCanManageLeague(userId, leagueId);

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

    if (
      managedMembership &&
      this.normalizeTeamName(managedMembership.team.name) ===
        this.normalizeTeamName(name)
    ) {
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

  async addGame(
    userId: string,
    leagueId: string,
    teamId: string,
    dto: CreateLeagueGameDto,
  ) {
    await this.assertUserCanManageLeague(userId, leagueId);

    const team = await this.prisma.team.findFirst({
      where: {
        id: teamId,
        leagueId,
      },
    });

    if (!team) {
      throw new BadRequestException('Team does not belong to this league');
    }

    return this.prisma.teamGame.create({
      data: {
        teamId,
        title: dto.title.trim(),
        startsAt: new Date(dto.startsAt),
        arena: dto.arena?.trim() || null,
        opponent: dto.opponent?.trim() || null,
        notes: dto.notes?.trim() || null,
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
    });
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

  private async assertUserCanManageLeague(
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

    const canManage = await this.prisma.league.findFirst({
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

    if (!canManage) {
      throw new ForbiddenException('You do not manage this league');
    }
  }

  private normalizeTeamName(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/^the\s+/, '')
      .replace(/\s+/g, ' ');
  }
}