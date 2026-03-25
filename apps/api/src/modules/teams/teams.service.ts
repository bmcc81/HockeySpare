import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../generated/prisma/client';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { CreateTeamGameDto } from './dto/create-team-game.dto';
import { NotifyTeamGameDto } from './dto/notify-team-game.dto';

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private async getOrCreateTeam(userId: string) {
    const existing = await this.prisma.team.findUnique({
      where: { ownerId: userId },
    });

    if (existing) return existing;

    return this.prisma.team.create({
      data: {
        ownerId: userId,
        name: 'My Team',
      },
    });
  }

  async getMyTeam(userId: string) {
    const team = await this.getOrCreateTeam(userId);

    return this.prisma.team.findUnique({
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
          },
        },
      },
    });
  }

  async addMember(userId: string, dto: CreateTeamMemberDto) {
    const team = await this.getOrCreateTeam(userId);

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
        notifyByApp: dto.notifyByApp ?? true,
        notifyByEmail: dto.notifyByEmail ?? false,
      },
    });
  }

  async createGame(userId: string, dto: CreateTeamGameDto) {
    const team = await this.getOrCreateTeam(userId);

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
    const team = await this.getOrCreateTeam(userId);

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
      .filter(member => member.userId && member.notifyByApp)
      .map(member => ({
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
    const team = await this.getOrCreateTeam(userId);

    await this.prisma.teamMember.deleteMany({
      where: {
        id: memberId,
        teamId: team.id,
      },
    });

    return { success: true };
  }
}