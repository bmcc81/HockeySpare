import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateRequestDto } from './dto/create-request.dto';

import {
  RequestType as CRequestType,
  Position as CPosition,
  SkillLevel as CSkillLevel,
} from '@hockeyspare/contracts';

import {
  NotificationType,
  Request as DbRequest,
  RequestStatus,
  RequestType as PRequestType,
  Position as PPosition,
  SkillLevel as PSkillLevel,
  OfferStatus,
  TeamRole,
} from '../../generated/prisma/client';

const typeToDb: Record<CRequestType, PRequestType> = {
  [CRequestType.TEAM_NEEDS_PLAYER]: PRequestType.TEAM_NEEDS_PLAYER,
  [CRequestType.PLAYER_NEEDS_TEAM]: PRequestType.PLAYER_NEEDS_TEAM,
};

const posToDb: Record<CPosition, PPosition> = {
  [CPosition.GOALIE]: PPosition.GOALIE,
  [CPosition.DEFENSE]: PPosition.DEFENSE,
  [CPosition.FORWARD]: PPosition.FORWARD,
};

const skillToDb: Record<CSkillLevel, PSkillLevel> = {
  [CSkillLevel.BEGINNER]: PSkillLevel.BEGINNER,
  [CSkillLevel.INTERMEDIATE]: PSkillLevel.INTERMEDIATE,
  [CSkillLevel.ADVANCED]: PSkillLevel.ADVANCED,
  [CSkillLevel.ELITE]: PSkillLevel.ELITE,
};

const typeFromDb: Record<PRequestType, CRequestType> = {
  [PRequestType.TEAM_NEEDS_PLAYER]: CRequestType.TEAM_NEEDS_PLAYER,
  [PRequestType.PLAYER_NEEDS_TEAM]: CRequestType.PLAYER_NEEDS_TEAM,
};

const posFromDb: Record<PPosition, CPosition> = {
  [PPosition.GOALIE]: CPosition.GOALIE,
  [PPosition.DEFENSE]: CPosition.DEFENSE,
  [PPosition.FORWARD]: CPosition.FORWARD,
};

const skillFromDb: Record<PSkillLevel, CSkillLevel> = {
  [PSkillLevel.BEGINNER]: CSkillLevel.BEGINNER,
  [PSkillLevel.INTERMEDIATE]: CSkillLevel.INTERMEDIATE,
  [PSkillLevel.ADVANCED]: CSkillLevel.ADVANCED,
  [PSkillLevel.ELITE]: CSkillLevel.ELITE,
};

function toApi(r: DbRequest) {
  return {
    ...r,
    type: typeFromDb[r.type],
    position: posFromDb[r.position],
    skillLevel: skillFromDb[r.skillLevel],
  };
}

@Injectable()
export class RequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async list() {
    return (
      await this.prisma.request.findMany({ orderBy: { id: 'desc' } })
    ).map(toApi);
  }

  async getById(id: number) {
    const item = await this.prisma.request.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Request not found');
    return toApi(item);
  }

  async create(userId: string, dto: CreateRequestDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException(`User not found for id: ${userId}`);
    }

    const created = await this.prisma.request.create({
      data: {
        user: { connect: { id: user.id } },
        status: RequestStatus.OPEN,
        type: typeToDb[dto.type],
        position: posToDb[dto.position],
        skillLevel: skillToDb[dto.skillLevel],
        payAmount: dto.payAmount ?? null,
        teamName: dto.teamName ?? null,
        playerName: dto.playerName ?? null,
        arena: dto.arena,
        arenaAddress: dto.arenaAddress ?? null,
        date: new Date(dto.date),
        time: dto.time,
        notes: dto.notes ?? null,
      },
    });

    await this.notifyMatchingOffers(created, user.id);

    return toApi(created);
  }

  private async notifyMatchingOffers(
    created: DbRequest,
    excludeUserId: string,
  ) {
    const matchingOffers = await this.prisma.playerOffer.findMany({
      where: {
        position: created.position,
        skillLevel: created.skillLevel,
        status: OfferStatus.OPEN,
        userId: { not: excludeUserId },
      },
    });

    await this.notificationsService.createMany(
      matchingOffers.map((offer) => ({
        userId: offer.userId,
        type: NotificationType.REQUEST_MATCH,
        title: 'New request matches your availability',
        body: `${created.position} needed at ${created.arena}${created.payAmount ? ` for $${created.payAmount}` : ''}`,
        link: `/requests/${created.id}`,
        metadata: {
          requestId: created.id,
          offerId: offer.id,
          requestType: created.type,
        },
      })),
    );
  }

  /**
   * Auto-posts an open "team needs player" marketplace request when a
   * roster player marks themselves unavailable/needing a spare for a game.
   * At most one auto-request is created per game, regardless of how many
   * players end up marking unavailable for it.
   */
  async createAutoRequestForTeamGame(params: {
    gameId: string;
    unavailableMemberId: string;
    note?: string;
  }): Promise<DbRequest | null> {
    const existing = await this.prisma.request.findFirst({
      where: { teamGameId: params.gameId },
      select: { id: true },
    });

    if (existing) {
      return null;
    }

    const [game, member] = await Promise.all([
      this.prisma.teamGame.findUnique({
        where: { id: params.gameId },
        include: { team: true, arena: true },
      }),
      this.prisma.teamMember.findUnique({
        where: { id: params.unavailableMemberId },
      }),
    ]);

    if (!game || !member || !member.position) {
      // Without a position we can't post a valid marketplace request; the
      // roster-spare notification (handled separately) still goes out.
      return null;
    }

    const ownerUserId = await this.resolveAutoRequestOwnerUserId(
      game.teamId,
      game.team.createdById,
    );

    if (!ownerUserId) {
      return null;
    }

    const notes =
      `Auto-posted: ${member.displayName} is unavailable for "${game.title}".` +
      (params.note ? ` Player note: ${params.note}` : '');

    const created = await this.prisma.request.create({
      data: {
        user: { connect: { id: ownerUserId } },
        teamGame: { connect: { id: game.id } },
        status: RequestStatus.OPEN,
        type: PRequestType.TEAM_NEEDS_PLAYER,
        position: member.position,
        // No per-player skill tracking exists yet; INTERMEDIATE is a
        // neutral default until that data is captured.
        skillLevel: PSkillLevel.INTERMEDIATE,
        teamName: game.team.name,
        arena: game.arena?.name ?? 'TBD',
        arenaAddress: game.arena?.address ?? null,
        date: game.startsAt,
        time: game.startsAt.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        }),
        notes,
      },
    });

    await this.notifyMatchingOffers(created, ownerUserId);

    return created;
  }

  private async resolveAutoRequestOwnerUserId(
    teamId: string,
    teamCreatedById: string | null,
  ): Promise<string | null> {
    const managers = await this.prisma.teamMember.findMany({
      where: {
        teamId,
        isActive: true,
        userId: { not: null },
        role: { in: [TeamRole.GENERAL_MANAGER, TeamRole.CAPTAIN] },
      },
      select: { userId: true, role: true },
    });

    const generalManager = managers.find(
      (manager) => manager.role === TeamRole.GENERAL_MANAGER,
    );

    return (
      generalManager?.userId ?? managers[0]?.userId ?? teamCreatedById ?? null
    );
  }
}
