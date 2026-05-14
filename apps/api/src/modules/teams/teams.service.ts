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
  LeagueRole,
} from '../../generated/prisma/client';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { CreateTeamGameDto } from './dto/create-team-game.dto';
import { NotifyTeamGameDto } from './dto/notify-team-game.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { CreateMyTeamDto } from './dto/create-my-team.dto';
import { EmailService } from '../email/email.service';
import { UpdateTeamMemberRoleDto } from './dto/update-team-member-role.dto';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
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

    const email = user.email.trim();

    const pendingMemberships = await this.prisma.teamMember.findMany({
      where: {
        userId: null,
        isActive: true,
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
      include: {
        team: true,
      },
    });

    if (!pendingMemberships.length) {
      return;
    }

    await this.prisma.teamMember.updateMany({
      where: {
        id: {
          in: pendingMemberships.map((membership) => membership.id),
        },
      },
      data: {
        userId: user.id,
      },
    });

    const inAppNotifications = pendingMemberships
      .filter((membership) => membership.notifyByApp)
      .map((membership) => ({
        userId: user.id,
        type: NotificationType.TEAM_MEMBER_ADDED,
        title: `You've been added to ${membership.team.name}`,
        body: `${membership.team.name} added you to their roster.`,
        link: '/my-team',
        metadata: {
          teamId: membership.teamId,
          memberId: membership.id,
        },
      }));

    if (inAppNotifications.length) {
      await this.notifications.createMany(inAppNotifications);
    }
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

  private async getManagedTeam(userId: string, teamId?: string) {
    if (teamId) {
      const targetTeam = await this.prisma.team.findUnique({
        where: {
          id: teamId,
        },
        include: {
          league: true,
        },
      });

      if (!targetTeam) {
        throw new NotFoundException('Team not found.');
      }

      const teamManagerMembership = await this.prisma.teamMember.findFirst({
        where: {
          userId,
          teamId: targetTeam.id,
          isActive: true,
          role: {
            in: [TeamRole.CAPTAIN, TeamRole.GENERAL_MANAGER],
          },
        },
        select: {
          id: true,
        },
      });

      if (teamManagerMembership) {
        return targetTeam;
      }

      if (targetTeam.leagueId) {
        const leagueManagerMembership =
          await this.prisma.leagueMember.findFirst({
            where: {
              userId,
              leagueId: targetTeam.leagueId,
              role: LeagueRole.LEAGUE_MANAGER,
            },
            select: {
              id: true,
            },
          });

        if (leagueManagerMembership) {
          return targetTeam;
        }
      }

      throw new ForbiddenException(
        'You do not have permission to manage this team.',
      );
    }

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
        'You do not have permission to manage this team.',
      );
    }

    throw new NotFoundException('No team found.');
  }

  async getMyTeam(userId: string, teamId?: string) {
    if (teamId) {
      const team = await this.getManagedTeam(userId, teamId);

      const fullTeam = await this.prisma.team.findUnique({
        where: {
          id: team.id,
        },
        include: {
          members: {
            where: {
              isActive: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          games: {
            orderBy: {
              startsAt: 'asc',
            },
            include: {
              opponentTeam: true,
              invites: true,
              availabilities: {
                include: {
                  member: true,
                },
              },
            },
          },
        },
      });

      if (!fullTeam) {
        throw new NotFoundException('Team not found.');
      }

      const myMembership = fullTeam.members.find(
        (member) => member.userId === userId,
      );

      return {
        ...fullTeam,
        canManageTeam: true,
        myMembership: myMembership ?? {
          id: null,
          teamId: fullTeam.id,
          userId,
          displayName: 'League Manager',
          email: null,
          phone: null,
          position: null,
          memberType: 'REGULAR',
          role: 'GENERAL_MANAGER',
          notifyByApp: false,
          notifyByEmail: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
    }

    if (teamId) {
      const team = await this.getManagedTeam(userId, teamId);

      const fullTeam = await this.prisma.team.findUnique({
        where: {
          id: team.id,
        },
        include: {
          members: {
            where: {
              isActive: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          games: {
            orderBy: {
              startsAt: 'asc',
            },
            include: {
              opponentTeam: true,
              invites: true,
              availabilities: {
                include: {
                  member: true,
                },
              },
            },
          },
        },
      });

      if (!fullTeam) {
        throw new NotFoundException('Team not found.');
      }

      const myMembership = fullTeam.members.find(
        (member) => member.userId === userId,
      );

      return {
        ...fullTeam,
        myMembership: myMembership ?? {
          id: null,
          teamId: fullTeam.id,
          userId,
          displayName: 'League Manager',
          email: null,
          phone: null,
          position: null,
          memberType: 'REGULAR',
          role: 'GENERAL_MANAGER',
          notifyByApp: false,
          notifyByEmail: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
    }
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
      },
    });

    if (!teamData) {
      throw new NotFoundException('No team found.');
    }

    const games = await this.prisma.teamGame.findMany({
      where: {
        startsAt: {
          gte: new Date(),
        },
        OR: [{ teamId: team.id }, { opponentTeamId: team.id }],
      },
      orderBy: {
        startsAt: 'asc',
      },
      include: {
        team: true,
        opponentTeam: true,
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
    });

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
      games,
      myMembership,
      canManageTeam:
        myMembership?.role === TeamRole.CAPTAIN ||
        myMembership?.role === TeamRole.GENERAL_MANAGER,
    };
  }

  async updateMyTeam(userId: string, dto: UpdateTeamDto, teamId?: string) {
    const team = await this.getManagedTeam(userId, teamId);

    return this.prisma.team.update({
      where: {
        id: team.id,
      },
      data: {
        name: dto.name.trim(),
      },
    });
  }

  async addMember(userId: string, dto: CreateTeamMemberDto, teamId?: string) {
    const team = await this.getManagedTeam(userId, teamId);

    const displayName = dto.displayName.trim();
    const email = dto.email?.trim() || null;
    const phone = dto.phone?.trim() || null;

    let linkedUserId: string | undefined;

    if (email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      linkedUserId = existingUser?.id;
    }

    const member = await this.prisma.teamMember.create({
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
      },
    });

    await this.notifyPlayerAddedToTeam({
      teamId: team.id,
      teamName: team.name,
      memberId: member.id,
      memberUserId: member.userId,
      memberEmail: member.email,
      memberName: member.displayName,
      memberType: member.memberType,
      notifyByApp: member.notifyByApp,
      notifyByEmail: member.notifyByEmail,
    });

    return member;
  }

  private async notifyPlayerAddedToTeam(args: {
    teamId: string;
    teamName: string;
    memberId: string;
    memberUserId: string | null;
    memberEmail: string | null;
    memberName: string;
    memberType: TeamMemberType;
    notifyByApp: boolean;
    notifyByEmail: boolean;
  }): Promise<void> {
    const appUrl = process.env.APP_URL ?? 'http://localhost:4200';
    const myTeamUrl = `${appUrl}/my-team`;
    const registerUserLink = `${appUrl}/register`;

    const tasks: Promise<unknown>[] = [];

    if (args.notifyByApp && args.memberUserId) {
      tasks.push(
        this.notifications.createMany([
          {
            userId: args.memberUserId,
            type: NotificationType.TEAM_MEMBER_ADDED,
            title: `You've been added to ${args.teamName}`,
            body: `${args.teamName} added you to their roster.`,
            link: '/my-team',
            metadata: {
              teamId: args.teamId,
              memberId: args.memberId,
            },
          },
        ]),
      );
    }

    if (args.notifyByEmail && args.memberEmail) {
      const memberTypeLabel =
        args.memberType === TeamMemberType.SPARE ? 'spare' : 'regular player';

      tasks.push(
        this.emailService.sendMail({
          to: args.memberEmail,
          subject: `You've been added to ${args.teamName}`,
          text: `Hi ${args.memberName}, you have been added to ${args.teamName} as a ${memberTypeLabel}. Open HockeySpare: ${myTeamUrl}`,
          html: `
          <p>Hi <strong>${args.memberName}</strong>,</p>
          <p>You have been added to <strong>${args.teamName}</strong> as a ${memberTypeLabel}.</p>
          <p>If you are not already registered, please <a href="${registerUserLink}">create an account</a>.</p>
          <p>You will then be able to view your team schedule and view team statistics.</p>
          <p>
            <a href="${myTeamUrl}">Open HockeySpare</a>
          </p>
        `,
        }),
      );
    }

    if (!tasks.length) {
      return;
    }

    const results = await Promise.allSettled(tasks);
    const failed = results.filter((result) => result.status === 'rejected');

    if (failed.length) {
      console.warn('One or more player-added notifications failed', failed);
    }
  }

  async removeMember(userId: string, memberId: string, teamId?: string) {
    const team = await this.getManagedTeam(userId, teamId);

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

  async createGame(userId: string, dto: CreateTeamGameDto, teamId?: string) {
    const team = await this.getManagedTeam(userId, teamId);

    let arenaId: string | null = null;

    const arenaName = dto.arena?.trim();

    if (team.leagueId && arenaName) {
      const arena = await this.prisma.leagueArena.upsert({
        where: {
          leagueId_name: {
            leagueId: team.leagueId,
            name: arenaName,
          },
        },
        update: {},
        create: {
          leagueId: team.leagueId,
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
        teamId: team.id,
        leagueId: team.leagueId ?? null,
        arenaId,
        title: dto.title.trim(),
        startsAt: new Date(dto.startsAt),
        opponent: dto.opponent?.trim() || null,
        notes: dto.notes?.trim() || null,
      },
      include: {
        arena: true,
      },
    });
  }

  async notifyGame(
    userId: string,
    gameId: string,
    dto: NotifyTeamGameDto,
    teamId?: string,
  ) {
    const team = await this.getManagedTeam(userId, teamId);

    const game = await this.prisma.teamGame.findFirst({
      where: {
        id: gameId,
        OR: [{ teamId: team.id }, { opponentTeamId: team.id }],
      },
      include: {
        team: true,
        opponentTeam: true,
        arena: true,
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found for your team');
    }

    const members = await this.prisma.teamMember.findMany({
      where: {
        teamId: team.id,
        isActive: true,
        ...(dto.memberIds?.length ? { id: { in: dto.memberIds } } : {}),
      },
    });

    if (members.length === 0) {
      throw new BadRequestException('No active team members found.');
    }

    const memberIds = members.map((member) => member.id);

    const existingInvites = await this.prisma.teamGameInvite.findMany({
      where: {
        gameId,
        memberId: {
          in: memberIds,
        },
      },
      select: {
        memberId: true,
      },
    });

    const alreadyNotifiedMemberIds = new Set(
      existingInvites.map((invite) => invite.memberId),
    );

    const membersToNotify = members.filter(
      (member) => !alreadyNotifiedMemberIds.has(member.id),
    );

    if (membersToNotify.length === 0) {
      return {
        success: true,
        sentCount: 0,
        inviteCount: 0,
        inAppSentCount: 0,
        emailSentCount: 0,
        emailFailedCount: 0,
        skippedAlreadyNotifiedCount: members.length,
        message:
          'All selected team members were already notified for this game.',
      };
    }

    const now = new Date();

    await this.prisma.teamGameInvite.createMany({
      data: membersToNotify.map((member) => ({
        gameId,
        memberId: member.id,
        status: 'SENT',
        sentAt: now,
      })),
      skipDuplicates: true,
    });

    const opponentName =
      game.teamId === team.id
        ? (game.opponentTeam?.name ?? game.opponent ?? 'TBD')
        : game.team.name;

    const arenaName = game.arena?.name ?? 'TBD';
    const arenaAddress = game.arena?.address?.trim() || 'Address TBD';

    const inAppNotifications = membersToNotify
      .filter((member) => member.userId && member.notifyByApp)
      .map((member) => ({
        userId: member.userId!,
        type: NotificationType.TEAM_GAME_REMINDER,
        title: `Game availability request: ${game.title}`,
        body: `${team.name} has a game against ${opponentName} on ${game.startsAt.toLocaleString()}. Please respond if you are available.`,
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

    const appUrl = (process.env.APP_URL ?? 'http://localhost:4200').replace(
      /\/$/,
      '',
    );

    const gameUrl = `${appUrl}/my-team`;

    const emailMembers = membersToNotify.filter(
      (member) => !!member.email && member.email.trim().length > 0,
    );

    const emailResults = await Promise.allSettled(
      emailMembers.map((member) =>
        this.emailService.sendMail({
          to: member.email!.trim(),
          subject: `Availability request: ${team.name} vs ${opponentName}`,
          text:
            `Hi ${member.displayName},\n\n` +
            `${team.name} has an upcoming game.\n\n` +
            `Game: ${game.title}\n` +
            `Date: ${game.startsAt.toLocaleString()}\n` +
            `Arena: ${arenaName}\n` +
            `Address: ${arenaAddress}\n` +
            `Opponent: ${opponentName}\n\n` +
            `Please respond if you are available:\n${gameUrl}\n\n` +
            `Thank you.`,
          html: `
          <p>Hi ${member.displayName},</p>

          <p>
            <strong>${team.name}</strong> has an upcoming game against
            <strong>${opponentName}</strong>. Please respond if you are available.
          </p>

          <p>
            <strong>Game:</strong> ${game.title}<br />
            <strong>Date:</strong> ${game.startsAt.toLocaleString()}<br />
            <strong>Arena:</strong> ${arenaName}<br />
            <strong>Address:</strong> ${arenaAddress}<br />
            <strong>Opponent:</strong> ${opponentName}<br />
          </p>

          <p>
            <a href="${gameUrl}">Respond in HockeySpare</a>
          </p>
        `,
        }),
      ),
    );

    const emailSentCount = emailResults.filter(
      (result) => result.status === 'fulfilled',
    ).length;

    const emailFailedCount = emailResults.length - emailSentCount;

    return {
      success: emailFailedCount === 0,
      sentCount: membersToNotify.length,
      inviteCount: membersToNotify.length,
      inAppSentCount: inAppNotifications.length,
      emailSentCount,
      emailFailedCount,
      skippedAlreadyNotifiedCount: members.length - membersToNotify.length,
    };
  }

  private async notifySparesForGame(args: {
    gameId: string;
    teamId: string;
    unavailableMemberId: string;
    unavailablePlayerName: string;
    status: 'UNAVAILABLE' | 'NEED_SPARE';
    note?: string;
  }) {
    const game = await this.prisma.teamGame.findUnique({
      where: {
        id: args.gameId,
      },
      include: {
        team: true,
        opponentTeam: true,
        arena: true,
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const spares = await this.prisma.teamMember.findMany({
      where: {
        teamId: args.teamId,
        memberType: TeamMemberType.SPARE,
        isActive: true,
        id: {
          not: args.unavailableMemberId,
        },
      },
    });

    if (!spares.length) {
      return {
        spareInviteCount: 0,
        spareEmailSentCount: 0,
        spareSmsSentCount: 0,
        spareSmsSkippedCount: 0,
        spareSmsFailedCount: 0,
        spareSkippedAlreadyNotifiedCount: 0,
      };
    }

    const spareIds = spares.map((spare) => spare.id);

    const existingInvites = await this.prisma.teamGameInvite.findMany({
      where: {
        gameId: args.gameId,
        memberId: {
          in: spareIds,
        },
      },
      select: {
        memberId: true,
      },
    });

    const alreadyNotifiedIds = new Set(
      existingInvites.map((invite) => invite.memberId),
    );

    const sparesToNotify = spares.filter(
      (spare) => !alreadyNotifiedIds.has(spare.id),
    );

    if (!sparesToNotify.length) {
      return {
        spareInviteCount: 0,
        spareEmailSentCount: 0,
        spareSmsSentCount: 0,
        spareSmsSkippedCount: 0,
        spareSmsFailedCount: 0,
        spareSkippedAlreadyNotifiedCount: spares.length,
      };
    }

    const now = new Date();

    await this.prisma.teamGameInvite.createMany({
      data: sparesToNotify.map((spare) => ({
        gameId: args.gameId,
        memberId: spare.id,
        status: 'SENT',
        sentAt: now,
      })),
      skipDuplicates: true,
    });

    const appUrl = (process.env.APP_URL ?? 'http://localhost:4200').replace(
      /\/$/,
      '',
    );

    const gameUrl = `${appUrl}/my-team`;
    const arenaName = game.arena?.name ?? 'TBD';
    const arenaAddress = game.arena?.address?.trim() || 'Address TBD';

    const opponentName =
      game.teamId === args.teamId
        ? (game.opponentTeam?.name ?? game.opponent ?? 'TBD')
        : game.team.name;

    const reason =
      args.status === 'NEED_SPARE'
        ? `${args.unavailablePlayerName} needs a spare.`
        : `${args.unavailablePlayerName} can’t make it.`;

    const emailResults = await Promise.allSettled(
      sparesToNotify
        .filter((spare) => !!spare.email && spare.email.trim().length > 0)
        .map((spare) =>
          this.emailService.sendMail({
            to: spare.email!.trim(),
            subject: `Spare needed: ${game.title}`,
            text:
              `Hi ${spare.displayName},\n\n` +
              `${reason}\n\n` +
              `Can you play this game?\n\n` +
              `Game: ${game.title}\n` +
              `Opponent: ${opponentName}\n` +
              `Date: ${game.startsAt.toLocaleString()}\n` +
              `Arena: ${arenaName}\n` +
              `Address: ${arenaAddress}\n` +
              `${args.note ? `Note: ${args.note}\n` : ''}` +
              `\nRespond here:\n${gameUrl}\n\n` +
              `Thank you.`,
            html: `
            <p>Hi <strong>${spare.displayName}</strong>,</p>

            <p>${reason}</p>

            <p><strong>Can you play this game?</strong></p>

            <p>
              <strong>Game:</strong> ${game.title}<br />
              <strong>Opponent:</strong> ${opponentName}<br />
              <strong>Date:</strong> ${game.startsAt.toLocaleString()}<br />
              <strong>Arena:</strong> ${arenaName}<br />
              <strong>Address:</strong> ${arenaAddress}<br />
              ${args.note ? `<strong>Note:</strong> ${args.note}<br />` : ''}
            </p>

            <p>
              <a href="${gameUrl}">Respond in HockeySpare</a>
            </p>
          `,
          }),
        ),
    );

    const smsResults = await Promise.allSettled(
      sparesToNotify
        .filter((spare) => !!spare.phone && spare.phone.trim().length > 0)
        .map((spare) =>
          this.smsService.sendSms({
            to: spare.phone!.trim(),
            tag: 'spare-request',
            body:
              `HockeySpare: ${reason} ` +
              `Can you play ${game.title} on ${game.startsAt.toLocaleString()} at ${arenaName}? ` +
              `Respond: ${gameUrl}`,
          }),
        ),
    );

    const spareEmailSentCount = emailResults.filter(
      (result) => result.status === 'fulfilled',
    ).length;

    const spareSmsSentCount = smsResults.filter((result) => {
      if (result.status !== 'fulfilled') {
        return false;
      }

      return !result.value?.skipped;
    }).length;

    const spareSmsSkippedCount = smsResults.filter((result) => {
      if (result.status !== 'fulfilled') {
        return false;
      }

      return result.value?.skipped === true;
    }).length;

    const spareSmsFailedCount = smsResults.filter(
      (result) => result.status === 'rejected',
    ).length;

    return {
      spareInviteCount: sparesToNotify.length,
      spareEmailSentCount,
      spareSmsSentCount,
      spareSmsSkippedCount,
      spareSmsFailedCount,
      spareSkippedAlreadyNotifiedCount: spares.length - sparesToNotify.length,
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
        opponentTeam: true,
        arena: true,
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const eligibleTeamIds = [game.teamId, game.opponentTeamId].filter(
      (teamId): teamId is string => !!teamId,
    );

    const member = await this.prisma.teamMember.findFirst({
      where: {
        teamId: {
          in: eligibleTeamIds,
        },
        userId,
        isActive: true,
      },
      include: {
        user: true,
        team: true,
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

    let spareNotification = {
      spareInviteCount: 0,
      spareEmailSentCount: 0,
      spareSmsSentCount: 0,
      spareSmsSkippedCount: 0,
      spareSmsFailedCount: 0,
      spareSkippedAlreadyNotifiedCount: 0,
    };

    if (status === 'UNAVAILABLE' || status === 'NEED_SPARE') {
      spareNotification = await this.notifySparesForGame({
        gameId,
        teamId: member.teamId,
        unavailableMemberId: member.id,
        unavailablePlayerName: member.displayName,
        status,
        note,
      });
    }

    const shouldEmailManagers =
      status === 'UNAVAILABLE' || status === 'NEED_SPARE';

    if (shouldEmailManagers) {
      const managers = await this.prisma.teamMember.findMany({
        where: {
          teamId: member.teamId,
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
      const arenaName = game.arena?.name ?? 'TBD';

      await Promise.allSettled(
        managers
          .filter((manager) => !!manager.user?.email)
          .map((manager) =>
            this.emailService.sendMail({
              to: manager.user!.email,
              subject: `${member.displayName} ${statusLabel} for ${game.title} on ${game.startsAt.toLocaleString()} at ${arenaName}`,
              text: `${member.displayName} ${statusLabel} for ${game.title}.${
                note ? ` Note: ${note}` : ''
              }`,
              html: `
                <p><strong>${member.displayName}</strong> ${statusLabel} for:</p>
                <p><strong>${game.title}</strong></p>
                <p><strong>Team:</strong> ${member.team.name}</p>
                <p><strong>Arena:</strong> ${arenaName}</p>
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

    return {
      ...response,
      spareNotification,
    };
  }

  async getGameAvailability(userId: string, gameId: string) {
    const team = await this.getUserTeam(userId);

    const game = await this.prisma.teamGame.findFirst({
      where: {
        id: gameId,
        OR: [{ teamId: team.id }, { opponentTeamId: team.id }],
      },
      include: {
        arena: true,
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

  async linkMemberToUser(
    managerUserId: string,
    memberId: string,
    teamId?: string,
  ) {
    const team = await this.getManagedTeam(managerUserId, teamId);

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
    teamId?: string,
  ) {
    const team = await this.getManagedTeam(managerUserId, teamId);

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
    teamId?: string,
  ) {
    const team = await this.getManagedTeam(managerUserId, teamId);

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

    return this.prisma.playerStat.upsert({
      where: {
        memberId_season: {
          memberId: member.id,
          season: dto.season,
        },
      },
      update: {
        gamesPlayed: dto.gamesPlayed,
        goals: dto.goals,
        assists: dto.assists,
        penaltyMins: dto.penaltyMins,
        teamId: team.id,
      },
      create: {
        memberId: member.id,
        teamId: team.id,
        season: dto.season,
        gamesPlayed: dto.gamesPlayed,
        goals: dto.goals,
        assists: dto.assists,
        penaltyMins: dto.penaltyMins,
      },
      include: {
        member: true,
        team: true,
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
      select: {
        id: true,
      },
    });

    let isLeagueManager = false;

    if (!currentUserMembership) {
      const targetTeam = await this.prisma.team.findUnique({
        where: {
          id: targetMember.teamId,
        },
        select: {
          leagueId: true,
        },
      });

      if (targetTeam?.leagueId) {
        const leagueManagerMembership =
          await this.prisma.leagueMember.findFirst({
            where: {
              userId,
              leagueId: targetTeam.leagueId,
              role: LeagueRole.LEAGUE_MANAGER,
            },
            select: {
              id: true,
            },
          });

        isLeagueManager = !!leagueManagerMembership;
      }
    }

    if (!currentUserMembership && !isLeagueManager) {
      throw new ForbiddenException(
        'Only a Team General Manager or League Manager can assign team roles.',
      );
    }

    if (currentUserMembership?.id === targetMember.id) {
      throw new BadRequestException('You cannot change your own role.');
    }

    if (targetMember.role === TeamRole.GENERAL_MANAGER && !isLeagueManager) {
      throw new BadRequestException(
        'Only a League Manager can change another General Manager role.',
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

  async getTeamStats(userId: string, teamId?: string) {
    const team = teamId
      ? await this.getManagedTeam(userId, teamId)
      : await this.getUserTeam(userId);

    return this.prisma.playerStat.findMany({
      where: {
        teamId: team.id,
      },
      include: {
        member: true,
        team: true,
      },
      orderBy: [
        {
          season: 'desc',
        },
        {
          member: {
            displayName: 'asc',
          },
        },
      ],
    });
  }
}
