import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  NotificationType,
  TeamMemberType,
  TeamRole,
} from '../../generated/prisma/client';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { CreateTeamGameDto } from './dto/create-team-game.dto';
import { NotifyTeamGameDto } from './dto/notify-team-game.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private buildDisplayName(user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  }): string {
    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    return fullName || user.email;
  }

  private async createDefaultTeamForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const displayName = this.buildDisplayName(user);
    const teamName = user.firstName ? `${user.firstName}'s Team` : 'My Team';

    return this.prisma.team.create({
      data: {
        createdById: userId,
        name: teamName,
        members: {
          create: {
            userId,
            displayName,
            email: user.email,
            memberType: TeamMemberType.REGULAR,
            role: TeamRole.GENERAL_MANAGER,
            notifyByApp: true,
            notifyByEmail: false,
            isActive: true,
          },
        },
      },
    });
  }

  private async getUserTeam(userId: string) {
    const membership = await this.prisma.teamMember.findFirst({
      where: {
        userId,
        isActive: true,
      },
      include: {
        team: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (membership) {
      return membership.team;
    }

    return this.createDefaultTeamForUser(userId);
  }

  private async getManagedTeam(userId: string) {
    const managerMembership = await this.prisma.teamMember.findFirst({
      where: {
        userId,
        isActive: true,
        role: {
          in: [TeamRole.CAPTAIN, TeamRole.GENERAL_MANAGER],
        },
      },
      include: {
        team: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (managerMembership) {
      return managerMembership.team;
    }

    const anyMembership = await this.prisma.teamMember.findFirst({
      where: {
        userId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (anyMembership) {
      throw new ForbiddenException(
        'You do not have permission to manage this team',
      );
    }

    return this.createDefaultTeamForUser(userId);
  }

  async updateMyTeam(userId: string, dto: UpdateTeamDto) {
    const team = await this.getManagedTeam(userId);

    return this.prisma.team.update({
      where: { id: team.id },
      data: {
        name: dto.name,
      },
    });
  }

  async getMyTeam(userId: string) {
    const team = await this.getUserTeam(userId);

    const [teamData, myMembership] = await Promise.all([
      this.prisma.team.findFirst({
        where: { id: team.id },
        include: {
          members: {
            where: { isActive: true },
            orderBy: [{ memberType: 'asc' }, { displayName: 'asc' }],
          },
          games: {
            orderBy: { startsAt: 'asc' },
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
      }),
      this.prisma.teamMember.findFirst({
        where: {
          teamId: team.id,
          userId,
          isActive: true,
        },
        select: {
          id: true,
          role: true,
          memberType: true,
          position: true,
        },
      }),
    ]);

    return {
      ...teamData,
      myMembership,
      canManageTeam:
        myMembership?.role === 'CAPTAIN' ||
        myMembership?.role === 'GENERAL_MANAGER',
    };
  }

  async addMember(userId: string, dto: CreateTeamMemberDto) {
    const team = await this.getManagedTeam(userId);

    let linkedUserId: string | undefined;

    if (dto.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
        select: { id: true },
      });

      linkedUserId = existingUser?.id;
    }

    return this.prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: linkedUserId,
        displayName: dto.displayName,
        email: dto.email,
        phone: dto.phone,
        position: dto.position,
        memberType: dto.memberType,
        role: TeamRole.PLAYER,
        notifyByApp: dto.notifyByApp ?? true,
        notifyByEmail: dto.notifyByEmail ?? false,
      },
    });
  }

  async createGame(userId: string, dto: CreateTeamGameDto) {
    const team = await this.getManagedTeam(userId);

    return this.prisma.teamGame.create({
      data: {
        teamId: team.id,
        title: dto.title,
        startsAt: new Date(dto.startsAt),
        arena: dto.arena,
        opponent: dto.opponent,
        notes: dto.notes,
      },
    });
  }

  async notifyGame(userId: string, gameId: string, dto: NotifyTeamGameDto) {
    const team = await this.getManagedTeam(userId);

    const game = await this.prisma.teamGame.findFirst({
      where: {
        id: gameId,
        teamId: team.id,
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const members = await this.prisma.teamMember.findMany({
      where: {
        teamId: team.id,
        isActive: true,
        ...(dto.memberIds?.length ? { id: { in: dto.memberIds } } : {}),
      },
    });

    for (const member of members) {
      await this.prisma.teamGameInvite.upsert({
        where: {
          gameId_memberId: {
            gameId,
            memberId: member.id,
          },
        },
        update: {
          status: 'SENT',
          sentAt: new Date(),
        },
        create: {
          gameId,
          memberId: member.id,
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    }

    const inAppNotifications = members
      .filter((member) => member.userId && member.notifyByApp)
      .map((member) => ({
        userId: member.userId!,
        type: NotificationType.TEAM_GAME_REMINDER,
        title: `Game reminder: ${game.title}`,
        body: `${team.name} has a game on ${game.startsAt.toLocaleString()}`,
        link: '/my-team',
        metadata: {
          gameId: game.id,
          teamId: team.id,
          memberId: member.id,
        },
      }));

    if (inAppNotifications.length) {
      await this.notifications.createMany(inAppNotifications);
    }

    return {
      success: true,
      sentCount: members.length,
    };
  }

  async removeMember(userId: string, memberId: string) {
    const team = await this.getManagedTeam(userId);

    await this.prisma.teamMember.deleteMany({
      where: {
        id: memberId,
        teamId: team.id,
      },
    });

    return { success: true };
  }

  async respondToGame(
    userId: string,
    gameId: string,
    status: 'AVAILABLE' | 'UNAVAILABLE' | 'NEED_SPARE',
    note?: string,
  ) {
    const game = await this.prisma.teamGame.findUnique({
      where: { id: gameId },
      include: { team: true },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const member = await this.prisma.teamMember.findFirst({
      where: {
        teamId: game.teamId,
        userId,
        isActive: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Team member not found for this user');
    }

    return this.prisma.teamGameAvailability.upsert({
      where: {
        gameId_memberId: {
          gameId,
          memberId: member.id,
        },
      },
      update: {
        status,
        note,
      },
      create: {
        gameId,
        memberId: member.id,
        status,
        note,
      },
      include: {
        member: true,
        game: true,
      },
    });
  }

  async getGameAvailability(userId: string, gameId: string) {
    const team = await this.getUserTeam(userId);

    const game = await this.prisma.teamGame.findFirst({
      where: {
        id: gameId,
        teamId: team.id,
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    return this.prisma.teamGameAvailability.findMany({
      where: { gameId },
      include: {
        member: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async getMyStats(userId: string) {
    return this.prisma.playerStat.findMany({
      where: { userId },
      include: {
        team: true,
        league: true,
      },
      orderBy: [{ season: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async upsertMemberStats(
    managerUserId: string,
    memberId: string,
    dto: {
      season: string;
      gamesPlayed: number;
      goals: number;
      assists: number;
      penaltyMins: number;
    },
  ) {
    const team = await this.getManagedTeam(managerUserId);

    const member = await this.prisma.teamMember.findFirst({
      where: {
        id: memberId,
        teamId: team.id,
        isActive: true,
      },
      select: {
        id: true,
        displayName: true,
        userId: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    if (!member.userId) {
      throw new NotFoundException(
        'This team member is not linked to a user account',
      );
    }

    return this.prisma.playerStat.upsert({
      where: {
        userId_teamId_season: {
          userId: member.userId,
          teamId: team.id,
          season: dto.season,
        },
      },
      update: {
        leagueId: team.leagueId ?? null,
        gamesPlayed: dto.gamesPlayed,
        goals: dto.goals,
        assists: dto.assists,
        penaltyMins: dto.penaltyMins,
      },
      create: {
        userId: member.userId,
        teamId: team.id,
        leagueId: team.leagueId ?? undefined,
        season: dto.season,
        gamesPlayed: dto.gamesPlayed,
        goals: dto.goals,
        assists: dto.assists,
        penaltyMins: dto.penaltyMins,
      },
    });
  }
}
