import {
  BadRequestException,
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
import { CreateMyTeamDto } from './dto/create-my-team.dto';
import { EmailService } from '../email/email.service';
import { UpdateTeamMemberRoleDto } from './dto/update-team-member-role.dto';

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  private buildDisplayName(user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  }): string {
    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    return fullName || user.email;
  }

  private async linkPendingTeamMembershipsByEmail(
    userId: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user?.email) {
      return;
    }

    const email = user.email.trim().toLowerCase();

    await this.prisma.teamMember.updateMany({
      where: {
        userId: null,
        isActive: true,
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
      data: {
        userId: user.id,
        email,
      },
    });
  }

  private async getUserTeam(userId: string) {
    await this.linkPendingTeamMembershipsByEmail(userId);

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

    if (!membership) {
      throw new NotFoundException('No team found.');
    }

    return membership.team;
  }

  private async getManagedTeam(userId: string) {
    await this.linkPendingTeamMembershipsByEmail(userId);

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

    throw new NotFoundException('No team found.');
  }

  async getMyTeam(userId: string) {
    await this.linkPendingTeamMembershipsByEmail(userId);

    const team = await this.getUserTeam(userId);

    const teamData = await this.prisma.team.findFirst({
      where: {
        id: team.id,
      },
      include: {
        league: true,
        members: {
          where: {
            isActive: true,
          },
          orderBy: [{ memberType: 'asc' }, { displayName: 'asc' }],
        },
        games: {
          where: {
            startsAt: {
              gte: new Date(),
            },
          },
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

    if (!teamData) {
      throw new NotFoundException('No team found.');
    }

    const myMembership = await this.prisma.teamMember.findFirst({
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
    });

    return {
      ...teamData,
      myMembership,
      canManageTeam:
        myMembership?.role === TeamRole.CAPTAIN ||
        myMembership?.role === TeamRole.GENERAL_MANAGER,
    };
  }

  async updateMyTeam(userId: string, dto: UpdateTeamDto) {
    const team = await this.getManagedTeam(userId);

    return this.prisma.team.update({
      where: {
        id: team.id,
      },
      data: {
        name: dto.name.trim(),
      },
    });
  }

  async addMember(userId: string, dto: CreateTeamMemberDto) {
    const team = await this.getManagedTeam(userId);

    const displayName = dto.displayName.trim();
    const email = dto.email?.trim().toLowerCase() || null;
    const phone = dto.phone?.trim() || null;

    if (!displayName) {
      throw new BadRequestException('Player name is required.');
    }

    let linkedUserId: string | undefined;

    if (email) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: {
            equals: email,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
        },
      });

      linkedUserId = existingUser?.id;
    }

    return this.prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: linkedUserId,
        displayName,
        email,
        phone,
        position: dto.position,
        memberType: dto.memberType,
        role: TeamRole.PLAYER,
        notifyByApp: dto.notifyByApp ?? true,
        notifyByEmail: dto.notifyByEmail ?? false,
        isActive: true,
      },
    });
  }

  async removeMember(userId: string, memberId: string) {
    const team = await this.getManagedTeam(userId);

    const member = await this.prisma.teamMember.findFirst({
      where: {
        id: memberId,
        teamId: team.id,
        isActive: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    if (member.userId === userId) {
      throw new BadRequestException(
        'You cannot remove yourself from the team.',
      );
    }

    if (member.role === TeamRole.GENERAL_MANAGER) {
      throw new BadRequestException('You cannot remove a General Manager.');
    }

    await this.prisma.teamMember.update({
      where: {
        id: memberId,
      },
      data: {
        isActive: false,
      },
    });

    return {
      success: true,
    };
  }

  async createGame(userId: string, dto: CreateTeamGameDto) {
    const team = await this.getManagedTeam(userId);

    return this.prisma.teamGame.create({
      data: {
        teamId: team.id,
        title: dto.title.trim(),
        startsAt: new Date(dto.startsAt),
        arena: dto.arena?.trim() || null,
        opponent: dto.opponent?.trim() || null,
        notes: dto.notes?.trim() || null,
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

  async respondToGame(
    userId: string,
    gameId: string,
    status: 'AVAILABLE' | 'UNAVAILABLE' | 'NEED_SPARE',
    note?: string,
  ) {
    await this.linkPendingTeamMembershipsByEmail(userId);

    const game = await this.prisma.teamGame.findUnique({
      where: {
        id: gameId,
      },
      include: {
        team: true,
      },
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
      include: {
        user: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Team member not found for this user');
    }

    const response = await this.prisma.teamGameAvailability.upsert({
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

    const shouldEmailManagers =
      status === 'UNAVAILABLE' || status === 'NEED_SPARE';

    if (shouldEmailManagers) {
      const managers = await this.prisma.teamMember.findMany({
        where: {
          teamId: game.teamId,
          isActive: true,
          userId: {
            not: null,
          },
          role: {
            in: [TeamRole.CAPTAIN, TeamRole.GENERAL_MANAGER],
          },
        },
        include: {
          user: true,
        },
      });

      const statusLabel =
        status === 'NEED_SPARE' ? 'needs a spare' : 'can’t make it';

      const appUrl = process.env.APP_URL ?? 'http://localhost:4200';
      const gameUrl = `${appUrl}/my-team`;

      await Promise.allSettled(
        managers
          .filter((manager) => !!manager.user?.email)
          .map((manager) =>
            this.emailService.sendMail({
              to: manager.user!.email,
              subject: `${member.displayName} ${statusLabel} for ${game.title} on ${game.startsAt.toLocaleString()} at ${game.arena}`,
              text: `${member.displayName} ${statusLabel} for ${game.title}.${
                note ? ` Note: ${note}` : ''
              }`,
              html: `
                <p><strong>${member.displayName}</strong> ${statusLabel} for:</p>
                <p><strong>${game.title}</strong></p>
                <p><strong>Team:</strong> ${game.team.name}</p>
                <p><strong>Arena:</strong> ${game.arena ?? 'N/A'}</p>
                <p><strong>Date:</strong> ${game.startsAt.toLocaleString()}</p>
                ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}
                <p>
                  <a href="${gameUrl}">Open HockeySpare</a>
                </p>
              `,
            }),
          ),
      );
    }

    return response;
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
      where: {
        gameId,
      },
      include: {
        member: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async linkMemberToUser(managerUserId: string, memberId: string) {
    const team = await this.getManagedTeam(managerUserId);

    const member = await this.prisma.teamMember.findFirst({
      where: {
        id: memberId,
        teamId: team.id,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        userId: true,
        displayName: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    if (member.userId) {
      return this.prisma.teamMember.findUnique({
        where: {
          id: member.id,
        },
      });
    }

    if (!member.email) {
      throw new NotFoundException('This player does not have an email to link');
    }

    const email = member.email.trim().toLowerCase();

    const user = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      throw new NotFoundException(
        'No registered app account was found for this email. Ask the player to sign up first, or update the roster email to match their account.',
      );
    }

    return this.prisma.teamMember.update({
      where: {
        id: member.id,
      },
      data: {
        userId: user.id,
        email,
      },
    });
  }

  async getMemberStats(
    managerUserId: string,
    memberId: string,
    season?: string,
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
      },
    });

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    if (season) {
      return this.prisma.playerStat.findUnique({
        where: {
          memberId_season: {
            memberId: member.id,
            season,
          },
        },
      });
    }

    return this.prisma.playerStat.findFirst({
      where: {
        memberId: member.id,
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
        userId: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    return this.prisma.playerStat.upsert({
      where: {
        memberId_season: {
          memberId: member.id,
          season: dto.season,
        },
      },
      update: {
        userId: member.userId ?? null,
        teamId: team.id,
        leagueId: team.leagueId ?? null,
        gamesPlayed: dto.gamesPlayed,
        goals: dto.goals,
        assists: dto.assists,
        penaltyMins: dto.penaltyMins,
      },
      create: {
        memberId: member.id,
        userId: member.userId ?? undefined,
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

  async getMyStats(userId: string) {
    await this.linkPendingTeamMembershipsByEmail(userId);

    return this.prisma.playerStat.findMany({
      where: {
        member: {
          userId,
        },
      },
      include: {
        team: true,
        league: true,
        member: true,
      },
      orderBy: [{ season: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async createMyTeam(userId: string, dto: CreateMyTeamDto) {
    await this.linkPendingTeamMembershipsByEmail(userId);

    const existingMembership = await this.prisma.teamMember.findFirst({
      where: {
        userId,
        isActive: true,
      },
      include: {
        team: true,
      },
    });

    if (existingMembership) {
      throw new BadRequestException('You are already on a team.');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const displayName = this.buildDisplayName(user);

    await this.prisma.team.create({
      data: {
        name: dto.name.trim(),
        createdById: userId,
        members: {
          create: {
            userId,
            displayName,
            email: user.email.trim().toLowerCase(),
            role: TeamRole.GENERAL_MANAGER,
            memberType: TeamMemberType.REGULAR,
            notifyByApp: true,
            notifyByEmail: true,
            isActive: true,
          },
        },
      },
    });

    return this.getMyTeam(userId);
  }

  async updateMemberRole(
    userId: string,
    memberId: string,
    dto: UpdateTeamMemberRoleDto,
  ) {
    const targetMember = await this.prisma.teamMember.findUnique({
      where: {
        id: memberId,
      },
    });

    if (!targetMember || !targetMember.isActive) {
      throw new NotFoundException('Team member not found');
    }

    const currentUserMembership = await this.prisma.teamMember.findFirst({
      where: {
        userId,
        teamId: targetMember.teamId,
        isActive: true,
        role: TeamRole.GENERAL_MANAGER,
      },
    });

    if (!currentUserMembership) {
      throw new ForbiddenException(
        'Only a General Manager can assign team roles.',
      );
    }

    if (currentUserMembership.id === targetMember.id) {
      throw new BadRequestException('You cannot change your own role.');
    }

    if (targetMember.role === TeamRole.GENERAL_MANAGER) {
      throw new BadRequestException(
        'You cannot change another General Manager role.',
      );
    }

    return this.prisma.teamMember.update({
      where: {
        id: memberId,
      },
      data: {
        role: dto.role,
      },
    });
  }

  async getTeamStats(userId: string) {
    const team = await this.getUserTeam(userId);

    return this.prisma.playerStat.findMany({
      where: {
        teamId: team.id,
        member: {
          isActive: true,
        },
      },
      include: {
        team: true,
        league: true,
        member: true,
      },
      orderBy: [{ season: 'desc' }, { updatedAt: 'desc' }],
    });
  }
}
