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
import { AddLeagueTeamMemberDto } from './dto/add-league-team-member.dto';

import { EmailService } from '../modules/email/email.service';
import { LeagueRole } from '../generated/prisma/client';

@Injectable()
export class LeaguesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

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
              include: {
                arena: true,
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
              include: {
                arena: true,
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
    await this.assertUserIsLeagueManager(userId, leagueId);
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

  async deleteArena(userId: string, leagueId: string, arenaId: string) {
    await this.assertUserIsLeagueManager(userId, leagueId);
    await this.assertUserCanAddTeamToLeague(userId, leagueId);

    const arena = await this.prisma.leagueArena.findFirst({
      where: {
        id: arenaId,
        leagueId,
      },
    });

    if (!arena) {
      throw new NotFoundException('Arena not found.');
    }

    await this.prisma.leagueArena.delete({
      where: {
        id: arenaId,
      },
    });

    return { success: true };
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
          include: {
            arena: true,
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
          include: {
            arena: true,
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

    let opponentTeamName: string | null = null;

    if (dto.opponentTeamId) {
      const opponentTeam = await this.prisma.team.findFirst({
        where: {
          id: dto.opponentTeamId,
          leagueId,
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (!opponentTeam) {
        throw new BadRequestException(
          'Opponent team must belong to this league',
        );
      }

      opponentTeamName = opponentTeam.name;
    }

    let arenaId: string | null = null;
    const arenaName = dto.arena?.trim();

    if (arenaName) {
      const arena = await this.prisma.leagueArena.upsert({
        where: {
          leagueId_name: {
            leagueId,
            name: arenaName,
          },
        },
        update: {},
        create: {
          leagueId,
          name: arenaName,
        },
        select: {
          id: true,
        },
      });

      arenaId = arena.id;
    }

    return this.prisma.teamGame.create({
      data: {
        leagueId,
        teamId,
        opponentTeamId: dto.opponentTeamId || null,
        arenaId,
        title,
        startsAt,
        opponent: opponentTeamName ?? dto.opponent?.trim() ?? null,
        notes: dto.notes?.trim() || null,
      },
      include: {
        team: true,
        opponentTeam: true,
        arena: true,
      },
    });
  }

  async addTeam(userId: string, leagueId: string, dto: CreateLeagueTeamDto) {
    await this.assertUserIsLeagueManager(userId, leagueId);
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
          include: {
            arena: true,
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
              include: {
                arena: true,
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
            include: {
              arena: true,
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
          include: {
            arena: true,
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

    const membership = await this.prisma.leagueMember.findFirst({
      where: {
        leagueId,
        userId,
        role: 'LEAGUE_MANAGER',
      },
      select: {
        id: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'Only a league manager can perform this league-wide action.',
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
            arena: true,
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

  async addMemberToLeagueTeam(
    managerUserId: string,
    leagueId: string,
    teamId: string,
    dto: AddLeagueTeamMemberDto,
  ) {
    await this.assertUserCanManageLeagueTeam(managerUserId, leagueId, teamId);

    const email = dto.email.trim().toLowerCase();
    const displayName = dto.displayName.trim();

    if (!displayName) {
      throw new BadRequestException('Player name is required');
    }

    const team = await this.prisma.team.findFirst({
      where: {
        id: teamId,
        leagueId,
      },
      select: {
        id: true,
        name: true,
        league: {
          select: {
            name: true,
            season: true,
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException('Team not found in this league');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
      },
    });

    const existingMember = await this.prisma.teamMember.findFirst({
      where: {
        teamId,
        isActive: true,
        OR: [
          {
            email: {
              equals: email,
              mode: 'insensitive',
            },
          },
          ...(existingUser?.id ? [{ userId: existingUser.id }] : []),
        ],
      },
    });

    if (existingMember) {
      throw new BadRequestException('This player is already on this team');
    }

    const member = await this.prisma.teamMember.create({
      data: {
        teamId,
        userId: existingUser?.id ?? null,
        displayName,
        email,
        phone: dto.phone?.trim() || null,
        position: dto.position ?? null,
        memberType: dto.memberType,
        role: dto.role ?? 'PLAYER',
        notifyByApp: true,
        notifyByEmail: dto.notifyByEmail ?? true,
        isActive: true,
      },
    });

    if (dto.notifyByEmail !== false) {
      await this.sendMemberInviteEmail({
        email,
        displayName,
        memberType: member.memberType,
        teamName: team.name,
        leagueName: team.league?.name,
      });
    }

    return member;
  }

  async bulkAddMembersToLeagueTeam(
    managerUserId: string,
    leagueId: string,
    teamId: string,
    rows: AddLeagueTeamMemberDto[],
  ) {
    await this.assertUserCanManageLeagueTeam(managerUserId, leagueId, teamId);

    const team = await this.prisma.team.findFirst({
      where: {
        id: teamId,
        leagueId,
      },
      select: {
        id: true,
        name: true,
        league: {
          select: {
            name: true,
            season: true,
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException('Team not found in this league');
    }

    const existingActiveMembers = await this.prisma.teamMember.findMany({
      where: {
        teamId,
        isActive: true,
      },
      select: {
        email: true,
        userId: true,
      },
    });

    const existingEmails = new Set(
      existingActiveMembers
        .map((member) => member.email?.toLowerCase())
        .filter((email): email is string => !!email),
    );

    const skipped: { displayName: string; email: string; reason: string }[] =
      [];
    const rowsToCreate: {
      displayName: string;
      email: string;
      phone: string | null;
      position: 'GOALIE' | 'DEFENSE' | 'FORWARD' | null;
      memberType: 'REGULAR' | 'SPARE';
      role: 'PLAYER' | 'CAPTAIN' | 'GENERAL_MANAGER';
      notifyByEmail: boolean;
    }[] = [];
    const seenInBatch = new Set<string>();

    for (const row of rows) {
      const displayName = row.displayName.trim();
      const email = row.email.trim().toLowerCase();

      if (!displayName) {
        skipped.push({ displayName, email, reason: 'Missing player name' });
        continue;
      }

      if (!email) {
        skipped.push({ displayName, email, reason: 'Missing email address' });
        continue;
      }

      if (existingEmails.has(email)) {
        skipped.push({
          displayName,
          email,
          reason: 'Already on this team',
        });
        continue;
      }

      if (seenInBatch.has(email)) {
        skipped.push({
          displayName,
          email,
          reason: 'Duplicate email in this import',
        });
        continue;
      }

      seenInBatch.add(email);
      rowsToCreate.push({
        displayName,
        email,
        phone: row.phone?.trim() || null,
        position: row.position ?? null,
        memberType: row.memberType,
        role: row.role ?? 'PLAYER',
        notifyByEmail: row.notifyByEmail ?? true,
      });
    }

    const usersByEmail = rowsToCreate.length
      ? await this.prisma.user.findMany({
          where: {
            email: {
              in: rowsToCreate.map((row) => row.email),
            },
          },
          select: {
            id: true,
            email: true,
          },
        })
      : [];

    const userIdByEmail = new Map(
      usersByEmail.map((user) => [user.email.toLowerCase(), user.id]),
    );

    const created = await this.prisma.$transaction(async (tx) => {
      const createdMembers: Awaited<ReturnType<typeof tx.teamMember.create>>[] =
        [];

      for (const row of rowsToCreate) {
        const member = await tx.teamMember.create({
          data: {
            teamId,
            userId: userIdByEmail.get(row.email) ?? null,
            displayName: row.displayName,
            email: row.email,
            phone: row.phone,
            position: row.position,
            memberType: row.memberType,
            role: row.role,
            notifyByApp: true,
            notifyByEmail: row.notifyByEmail,
            isActive: true,
          },
        });

        createdMembers.push(member);
      }

      return createdMembers;
    });

    for (const member of created) {
      if (!member.email || member.notifyByEmail === false) {
        continue;
      }

      try {
        await this.sendMemberInviteEmail({
          email: member.email,
          displayName: member.displayName,
          memberType: member.memberType,
          teamName: team.name,
          leagueName: team.league?.name,
        });
      } catch {
        // Import already succeeded; a failed invite email shouldn't fail the whole batch.
      }
    }

    return { created, skipped };
  }

  private async sendMemberInviteEmail(params: {
    email: string;
    displayName: string;
    memberType: string;
    teamName: string;
    leagueName?: string | null;
  }): Promise<void> {
    const { email, displayName, memberType, teamName, leagueName } = params;

    const appUrl = (process.env.APP_URL ?? 'http://localhost:4200').replace(
      /\/$/,
      '',
    );

    const registerUrl = `${appUrl}/register?email=${encodeURIComponent(email)}`;
    const myTeamUrl = `${appUrl}/my-team`;

    const memberTypeLabel = memberType === 'SPARE' ? 'spare' : 'regular player';

    await this.emailService.sendMail({
      to: email,
      subject: `You have been invited to join ${teamName} on HockeySpare`,
      text:
        `Hi ${displayName},\n\n` +
        `You have been invited to join ${teamName} as a ${memberTypeLabel} in ${leagueName}.\n\n` +
        `If you already have a HockeySpare account, log in here:\n${myTeamUrl}\n\n` +
        `If you do not have an account yet, create one using this same email address:\n${registerUrl}\n\n` +
        `Once registered, you will be linked to the team automatically.`,
      html: `
        <p>Hi <strong>${displayName}</strong>,</p>

        <p>
          You have been invited to join
          <strong>${teamName}</strong>
          as a <strong>${memberTypeLabel}</strong>
          in <strong>${leagueName}</strong>.
        </p>

        <p>
          If you already have a HockeySpare account, open your team page:
        </p>

        <p>
          <a href="${myTeamUrl}">Open My Team</a>
        </p>

        <p>
          If you do not have an account yet, create one using this same email address:
        </p>

        <p>
          <a href="${registerUrl}">Create HockeySpare account</a>
        </p>

        <p>
          Once registered, you will be linked to the team automatically.
        </p>

        <p>Thanks,<br />HockeySpare</p>
      `,
    });
  }

  private async assertUserIsLeagueManager(
    userId: string,
    leagueId: string,
  ): Promise<void> {
    const league = await this.prisma.league.findUnique({
      where: { id: leagueId },
      select: { id: true },
    });

    if (!league) {
      throw new NotFoundException('League not found');
    }

    const membership = await this.prisma.leagueMember.findFirst({
      where: {
        leagueId,
        userId,
        role: 'LEAGUE_MANAGER',
      },
      select: {
        id: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'Only a league manager can perform this action.',
      );
    }
  }

  async removeMemberFromLeagueTeam(
    userId: string,
    leagueId: string,
    teamId: string,
    memberId: string,
  ) {
    await this.assertUserCanManageLeagueTeam(userId, leagueId, teamId);

    const member = await this.prisma.teamMember.findFirst({
      where: {
        id: memberId,
        teamId,
        isActive: true,
      },
      select: {
        id: true,
        displayName: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    await this.prisma.teamMember.update({
      where: { id: member.id },
      data: {
        isActive: false,
      },
    });

    return {
      id: member.id,
      displayName: member.displayName,
      removed: true,
    };
  }

  async updateLeagueTeamMemberRole(
    userId: string,
    leagueId: string,
    teamId: string,
    memberId: string,
    role: 'PLAYER' | 'CAPTAIN' | 'GENERAL_MANAGER',
  ) {
    await this.assertUserCanManageLeagueTeam(userId, leagueId, teamId);

    const member = await this.prisma.teamMember.findFirst({
      where: {
        id: memberId,
        teamId,
        isActive: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    return this.prisma.teamMember.update({
      where: {
        id: member.id,
      },
      data: {
        role,
      },
    });
  }

  private async canManageScoreSheet(userId: string, leagueId: string) {
    const membership = await this.prisma.leagueMember.findFirst({
      where: {
        userId,
        leagueId,
        role: {
          in: [LeagueRole.LEAGUE_MANAGER, LeagueRole.TIMEKEEPER],
        },
      },
    });

    return !!membership;
  }
}
